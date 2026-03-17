import numpy as np
import cv2
from deepface import DeepFace
from fastapi import UploadFile, File, Form, APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.schemas.user_schema import *
from app.utils.image_utils import base64_to_image
from app.services.face_service import extract_embedding
from app.services.embedding_service import *
from app.services.attendance_service import find_best_match
from app.db.models.biometric_profile import BiometricProfile
from app.db.models.users import User
from app.core.startup import load_users_into_memory


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
        contents = await image.read()
        np_img = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

        if img is None:
            continue

        try:
            faces = DeepFace.extract_faces(
                img,
                detector_backend="opencv",
                enforce_detection=True
            )

            if len(faces) == 0:
                continue

            face = faces[0]["face"]

            # resize face to model input size
            face = cv2.resize(face, (160, 160))

            imgs.append(face)

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

    profile = db.query(BiometricProfile).filter(
        BiometricProfile.user_id == user_id
    ).first()

    if not profile:
        profile = BiometricProfile(
            user_id=user_id,
            face_template=blob
        )
        db.add(profile)
    else:
        profile.face_template = blob

    db.commit()

    # refresh in-memory embeddings
    load_users_into_memory()

    return {"message": "Face enrolled successfully"}


@router.post("/verify")
async def verify_face(
    user_id: int = Form(...),
    image: UploadFile = File(...)
):
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

    best_user, best_score = find_best_match(new_embedding)

    threshold = 0.6  # stricter threshold

    verified = best_score >= threshold

    return {
        "verified": verified,
        "user_id": best_user if verified else None,
        "score": best_score
    }
