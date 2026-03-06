from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from sqlalchemy.orm import Session
from app.services.embedding_service import from_blob
from app.db.models.biometric_profile import BiometricProfile
from app.db.session import SessionLocal

user_biometric_cache = {}


def load_users_into_memory():
    """
    Load all students embeddings from the database into memeoty
    Call this once at startup
    """
    global user_biometric_cache
    db = SessionLocal()

    try:
        face_templates = db.query(BiometricProfile).all()
        for s in face_templates:
            if s.face_template is not None:
                user_biometric_cache[s.user_id] = from_blob(s.face_template)
    finally:
        db.close()


def find_best_match(new_embedding: np.ndarray):
    """
    Compare new face embedding with all cached embeddings
    and return the user_id and similarity score of the best match.
    """

    best_score = -1
    best_user = None

    for user_id, face_template in user_biometric_cache.items():
        # reshape for cosine similarity (1,n)
        score = cosine_similarity(
            new_embedding.reshape(1, -1),
            face_template.reshape(1, -1)
        )[0][0]

        if score > best_score:
            best_score = score
            best_user = user_id

    return best_user, best_score
