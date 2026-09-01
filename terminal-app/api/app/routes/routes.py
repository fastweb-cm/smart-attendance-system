import numpy as np
import cv2
from deepface import DeepFace
from fastapi import UploadFile, File, Form, APIRouter, Depends, HTTPException, status
import time
import faiss
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.schemas.user_schema import VerifyResponse, UserResponse, CardVerifyRequest
from app.utils.image_utils import base64_to_image
from app.services.face_service import extract_embedding
from app.services.embedding_service import *
import app.services.attendance_service as attendance_service
from app.db.models.users import User
from app.crud.user_crud import get_user_details_by_id, get_user_face_template_by_id, get_user_auth_policy, get_user_id_by_code, get_user_original_face_template_by_id, get_user_fingerprint_template_by_id, get_all_fingerprint_templates
from app.crud.attendance_crud import process_attendance_step
from app.schemas.terminal import TerminalConfigUpdateRequest
from app.core.config import update_terminal_id
from app.crud.face_buffer import create_face_buffer_entry, get_face_buffer_count_for_user, get_face_buffers_by_user_id, clear_face_buffers_for_user
import app.services.fingerprint_service as fingerprint_service
from gi.repository import GLib

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
        user_details = get_user_details_by_id(db, user_id, context)

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

    # AUTO Enroll if user face template not found
    if user_id is not None:
        # check for refined face, fallback to original
        stored_template_blob = get_user_face_template_by_id(db, user_id)

        if stored_template_blob is None:
            # Auto enrollment start
            print(
                f"Face template not found for user {user_id}. Auto enrolling...")

            # save to db
            blob = to_blob(new_embedding)
            user_record = db.query(User).filter(User.id == user_id).first()
            if user_record:
                user_record.face_template = blob
                # this one will eventually update overtime
                user_record.face_template_refined = blob
                # mark for sync so the central server gets this new face
                user_record.sync_status = "pending"
                db.commit()

            # update faiss index
            if user_id not in attendance_service.user_ids:
                attendance_service.load_users_into_memory()

            # mark as verified since it's auto enrolled
            verified = True
            best_user = user_id

        if not verified:
            # user face template already exists, proceed with 1:1 normal verification
            user_embedding = from_blob(stored_template_blob)

            best_score = attendance_service.verify_user_embedding(
                user_embedding, new_embedding)
            print("verification score:", best_score)
            verified = best_score >= threshold
            best_user = user_id if verified else None

    else:
        # standard 1:N search in faiss index
        best_user, best_score = attendance_service.find_best_match(
            new_embedding)
        verified = best_score >= threshold

    # if no user_id initially provided, we fetch user details of the best match
    if not user_details and verified and best_user is not None:
        user_details = get_user_details_by_id(db, best_user, context)

    # get the user's auth policy and process attendance step
    if verified and user_details:
        group_policy = get_user_auth_policy(
            db, user_details.id, terminal_id, context, event_id)
        result = process_attendance_step(
            db, user_details.id, terminal_id, auth_type, group_policy, auth_type_id, event_id, context)

        attendance_status = result["status"]
        next_step = result["next_step"]
        attendance_type = result["attendance_type"]

        # Add to buffer
        create_face_buffer_entry(
            db, best_user, to_blob(new_embedding), best_score)

        # check if we have reached he training the limit
        sample_count = get_face_buffer_count_for_user(db, best_user)

        if sample_count >= 20:
            samples = get_face_buffers_by_user_id(db, best_user)

            # convert blobs back to embeddings
            samples_embedding = [from_blob(s.face_template) for s in samples]

            # calculate centroid (average face)
            refined_embeddings = np.mean(samples_embedding, axis=0)
            faiss.normalize_L2(refined_embeddings.reshape(1, -1))

            # Always compare back to the absolute original
            original_blob = get_user_original_face_template_by_id(
                db, best_user)
            original_emb = from_blob(original_blob)

            # verify the centroid embeddings against the original embs in db
            similatity_to_origin = attendance_service.verify_user_embedding(
                original_emb, refined_embeddings)

            if similatity_to_origin > 0.45:
                user_rec = db.query(User).filter(User.id == best_user).first()

                # rotate only the refined template
                user_rec.face_template_refined = to_blob(refined_embeddings)
                user_rec.sync_status = "pending"  # so it can be synced to central server

                # clear the buffer for the next learning cycle
                clear_face_buffers_for_user(db, best_user)

                # update faiss index
                attendance_service.load_users_into_memory()

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
    request: CardVerifyRequest,
    db: Session = Depends(get_db)
):
    # validation check for required fields
    if request.auth_type not in ["face", "fingerprint", "card"] and request.terminal_id is None:
        raise HTTPException(status_code=400, details="Missing required fields")

    # prepare some important variables
    context = "event" if request.event_id is not None else "daily"
    event_id = request.event_id if request.event_id is not None else None
    attendance_status = None

    user_details = None
    if request.user_id is not None:
        # we first check whether is allowed to auth at this terminal
        user_details = get_user_details_by_id(db, request.user_id, context)

        if user_details is None:
            raise HTTPException(status_code=404, detail="User not found")

    # logic to compare the card serial number against stored values
    id = get_user_id_by_code(db, request.serial)
    verified = True if id is not None else False

    # and user details
    if verified:
        group_policy = get_user_auth_policy(
            db, id, request.terminal_id, context, event_id)
        result = process_attendance_step(
            db, id, request.terminal_id, request.auth_type, group_policy, request.auth_type_id, event_id, context
        )

        if not user_details:
            user_details = get_user_details_by_id(db, id, context)

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


@router.post("/terminal/update-id")
async def update_terminal_config(payload: TerminalConfigUpdateRequest):
    try:
        if payload.terminal_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid structural Terminal ID configuration."
            )
        # Write the id to sync_config.json
        update_terminal_id(payload.terminal_id)

        print("Terminal sync config updated successfully")

        return {
            "success": True,
            "message": f"Terminal sync identity provisioned to ID: {payload.terminal_id}"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/verify/fingerprint", response_model=VerifyResponse)
async def verify_fingerprint(
    user_id: int | None = Form(None),
    event_id: int | None = Form(None),
    terminal_id: int = Form(...),
    auth_type: str = Form(...),
    auth_type_id: int = Form(...),
    db: Session = Depends(get_db),
):
    context = "event" if event_id is not None else "daily"
    user_details = None
    if user_id is not None:
        user_details = get_user_details_by_id(db, user_id, context)
        if user_details is None:
            raise HTTPException(status_code=404, detail="User not found")

    try:
        new_template = fingerprint_service.capture_and_extract()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except GLib.Error:
        raise HTTPException(
            status_code=408, detail="No finger detected. Please try again.")

    verified = False
    best_user = None
    attendance_status = None

    if user_id is not None:
        stored = get_user_fingerprint_template_by_id(db, user_id)
        if stored is None:
            user_record = db.query(User).filter(User.id == user_id).first()
            user_record.fingerprint_template = new_template
            user_record.sync_status = "pending"
            db.commit()
            verified = True
            best_user = user_id
        else:
            verified, _ = fingerprint_service.match_templates(
                stored, new_template)
            best_user = user_id if verified else None
    else:
        known = get_all_fingerprint_templates(db)  # {user_id: template_bytes}
        best_user, _ = fingerprint_service.identify(new_template, known)
        verified = best_user is not None

    if not user_details and verified and best_user is not None:
        user_details = get_user_details_by_id(db, best_user, context)

    if verified and user_details:
        group_policy = get_user_auth_policy(
            db, user_details.id, terminal_id, context, event_id)
        result = process_attendance_step(
            db, user_details.id, terminal_id, auth_type, group_policy, auth_type_id, event_id, context)
        attendance_status = result["status"]
        next_step = result["next_step"]
        attendance_type = result["attendance_type"]

    if attendance_status == "error":
        raise HTTPException(
            status_code=400, detail="Invalid attendance action")

    if verified and user_details:
        return VerifyResponse(verified=True, attendance_status=attendance_status, next_step=next_step,
                              attendance_type=attendance_type,
                              user=UserResponse(id=user_details.id, groupId=user_details.group_id,
                                                subgroupId=user_details.subgroup_id,
                                                fName=user_details.fname, lName=user_details.lname))
    return VerifyResponse(verified=False, user=None)
