import numpy as np
import cv2
from deepface import DeepFace
from fastapi import UploadFile, File, Form, APIRouter, Depends, HTTPException
import time
import faiss
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.schemas.user_schema import VerifyResponse, UserResponse
from app.utils.image_utils import base64_to_image
from app.services.face_service import extract_embedding
from app.services.embedding_service import *
import app.services.attendance_service as attendance_service
from app.db.models.users import User
from app.crud.user_crud import get_user_details_by_id, get_user_face_template_by_id, get_user_auth_policy
from app.crud.attendance_crud import process_attendance_step
from app.schemas.terminal import TerminalConfigUpdateRequest
from app.core.config import update_terminal_id


# Creates a router object that will hold all routes in this file
router = APIRouter()

# Dependency function that creates db session
# FastAPI will call this automatically whenever a route needs a DB conn


def get_db():
    # Creates a new session using the the SessionLocal factory
    db = SessionLocal()

    try:
        # Returns the session to the route that requested it
        yield db
    finally:
        # Closes the DB conn, on either success or error
        db.close()


@router.get("/health")
def health_check():
    """
    Health check
    """
    return {"status": "ok"}


@router.post("/enroll-face")
async def enroll_face(
    user_id: int = Form(...),
    images: list[UploadFile] = File(...),
    db: Session = Depends(get_db)
):

    if len(images) < 3:
        raise HTTPException(
            status_code=400,
            detail="At least 3 images required"
        )

    imgs = []

    for image in images:
        contents = await image.read()  # reads the uploaded file and returns raw byte
        # converts raw bytes to numpy array
        np_img = np.frombuffer(contents, np.uint8)
        # converts the bytes array into actual image
        img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

        if img is None:
            continue

        try:
            faces = DeepFace.extract_faces(
                img,
                detector_backend="opencv",
                enforce_detection=True
            )  # attempt to detect face from the extracted image

            if len(faces) == 0:
                continue

            face = faces[0]["face"]

            # resize face to model input size
            face = cv2.resize(face, (160, 160))

            imgs.append(face)  # append the face to the list(array)

        except Exception:
            print("Skipping frame (no face detected)")

    if len(imgs) < 3:
        raise HTTPException(
            status_code=400,
            detail="Not enough valid face images. Try again."
        )

    embeddings = extract_embedding(imgs)

    if len(embeddings) < 3:
        raise HTTPException(
            status_code=400,
            detail="Failed to extract enough embeddings"
        )

    # average embeddings
    final_embedding = np.mean(embeddings, axis=0)

    # normalize again after averaging
    final_embedding = final_embedding / np.linalg.norm(final_embedding)

    blob = to_blob(final_embedding)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Invalid user")

    # store embedding directly in User (local cache db)
    user.face_template = blob
    db.commit()

    # append newly enrolled embedding in faise vector db
    new_embedding = final_embedding.astype("float32").reshape(1, -1)
    faiss.normalize_L2(new_embedding)
    if attendance_service.faiss_index is None:
        dimension = new_embedding.shape[1]
        attendance_service.faiss_index = faiss.IndexFlatIP(dimension)

    attendance_service.faiss_index.add(new_embedding)
    attendance_service.user_ids.append(user_id)

    return {"message": "Face enrolled successfully"}


@router.post("/verify/face", response_model=VerifyResponse)
async def verify_face(
    user_id: int | None = Form(None),
    event_id: int | None = Form(None),
    terminal_id: int = Form(...),
    auth_type: str = Form(...),
    auth_type_id: int = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    start = time.time()
    # validation check for required fields
    if auth_type not in ["face", "fingerprint", "card"] and terminal_id is None:
        raise HTTPException(status_code=400, detail="Missing required fields")

    # prepare some important variables
    context = "event" if event_id is not None else "daily"
    event_id = event_id if event_id is not None else None

    user_details = None
    if user_id is not None:
        # we first check whether is allowed to auth at this terminal
        user_details = get_user_details_by_id(db, user_id)

        if user_details is None:
            raise HTTPException(status_code=404, detail="User not found")

    # process the uploaded image for face recognition
    contents = await image.read()
    np_img = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    try:
        faces = DeepFace.extract_faces(
            img,
            detector_backend="opencv",
            enforce_detection=True
        )

        if len(faces) == 0:
            raise HTTPException(status_code=400, detail="No face detected")

        face = faces[0]["face"]
        face = cv2.resize(face, (160, 160))

    except Exception:
        raise HTTPException(
            status_code=400, detail="Face detection failed. Please ensure you are not sending a blurry or dark image")

    embeddings = extract_embedding([face])

    if len(embeddings) == 0:
        raise HTTPException(status_code=400, detail="Embedding failed")

    new_embedding = embeddings[0]

    # stricter threshold if user_id provided
    threshold = 0.54 if user_id is not None else 0.5
    verified = False
    best_user = None
    best_score = 0.0
    attendance_status = None

    if user_id is not None:
        # if user_id provided, we directly fetch the stored embedding and compare with the new one (bypassing faiss)
        stored_template_blob = get_user_face_template_by_id(db, user_id)

        if stored_template_blob is None:
            raise HTTPException(
                status_code=404, detail="No face template found, please enroll face first")

        user_embedding = from_blob(stored_template_blob)

        best_score = attendance_service.verify_user_embedding(
            user_embedding, new_embedding)
        print("verification score:", best_score)
        verified = best_score >= threshold
        best_user = user_id if verified else None

    else:
        # find the best match from faiss index
        # run it 10000 for testing
        for _ in range(10000):
            best_user, best_score = attendance_service.find_best_match(
                new_embedding)
            print("best match score:", best_score)
            verified = best_score >= threshold

    # if no user_id initially provided, we fetch user details of the best match
    if not user_details and verified and best_user is not None:
        user_details = get_user_details_by_id(db, best_user)

    # get the user's auth policy and process attendance step
    if verified and user_details:
        group_policy = get_user_auth_policy(db, user_details.id, terminal_id)
        result = process_attendance_step(
            db, user_details.id, terminal_id, auth_type, group_policy, auth_type_id, event_id, context)

        attendance_status = result["status"]
        next_step = result["next_step"]
        attendance_type = result["attendance_type"]

    # if attendance status is error raise an exception(user is trying to checkout too early)
    if attendance_status == "error":
        raise HTTPException(
            status_code=400, detail="Invalid attendance action")

    print("avg time:", (time.time() - start))
    # prepare response data
    if verified and user_details:
        response = VerifyResponse(
            verified=True,
            attendance_status=attendance_status,
            next_step=next_step,
            attendance_type=attendance_type,
            user=UserResponse(
                id=user_details.id,
                groupId=user_details.group_id,
                subgroupId=user_details.subgroup_id,
                fName=user_details.fname,
                lName=user_details.lname
            )
        )
    else:
        response = VerifyResponse(
            verified=False,
            user=None
        )

    return response


@router.post("/verify/card", response_model=VerifyResponse)
async def verify_card(
    user_id: int | None,
    event_id: int | None,
    terminal_id: int,
    auth_type: str,
    auth_type_id: int,
    db: Session = Depends(get_db)
):
    # validation check for required fields
    if auth_type not in ["face", "fingerprint", "card"] and terminal_id is None:
        raise HTTPException(status_code=400, details="Missing required fields")

    # prepare some important variables
    context = "event" if event_id is not None else "daily"
    event_id = event_id if event_id is not None else None

    user_details = None
    if user_id is not None:
        # we first check whether is allowed to auth at this terminal
        user_details = get_user_details_by_id(db, user_id)

        if user_details is None:
            raise HTTPException(status_code=404, detail="User not found")

    # logic to compare the card serial number against stored values
    verified = True

    id = user_id if user_id is not None else 1

    # and user details
    if verified:
        group_policy = get_user_auth_policy(db, id, terminal_id)
        result = process_attendance_step(
            db, id, terminal_id, auth_type, group_policy, auth_type_id, event_id, context
        )

        attendance_status = result["status"]
        next_step = result["next_step"]
        attendance_type = result["attendance_type"]

    # if attendance status is error raise an exception(user is trying to checkout too early)
    if attendance_status == "error":
        raise HTTPException(
            status_code=400, detail="Invalid attendance action")

    # prepare response data
    # and user details
    if verified:
        response = VerifyResponse(
            verified=True,
            attendance_status=attendance_status,
            next_step=next_step,
            attendance_type=attendance_type,
            user=UserResponse(
                id=id
            )
        )


@router.post("/terminal/update-id")
async def update_terminal_config(payload: TerminalConfigUpdateRequest):
    update_terminal_id(payload.terminal_id)
