import numpy as np
import cv2
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
            detail="At least 3 images required for enrollment"
        )

    embeddings = []

    for image in images:

        contents = await image.read()

        np_img = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

        if img is None:
            continue

        # resize image
        img = cv2.resize(img, (224, 224))

        embedding = extract_embedding(img)

        embeddings.append(embedding)

    if len(embeddings) == 0:
        raise HTTPException(
            status_code=400,
            detail="No valid face embeddings extracted"
        )

    # average embeddings
    final_embedding = np.mean(embeddings, axis=0)

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

    img = cv2.resize(img, (224, 224))
    embedding = extract_embedding(img)

    best_user, best_score = find_best_match(embedding)
    if best_score < 0.5:
        return {
            "verified": False,
            "user_id": best_user,
            "score": float(best_score)
        }

    return {
        "verified": True,
        "user_id": best_user,
        "score": float(best_score)
    }
