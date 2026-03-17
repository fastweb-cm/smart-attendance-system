from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from sqlalchemy.orm import Session
from app.services.embedding_service import from_blob
from app.db.models.biometric_profile import BiometricProfile
from app.db.session import SessionLocal

# Prepare a global cache
user_ids = []
# 512 = ArcFace embedding size
user_embeddings = np.empty((0, 512), dtype=np.float32)


def load_users_into_memory():
    global user_ids, user_embeddings
    db = SessionLocal()
    try:
        face_templates = db.query(BiometricProfile).all()
        embeddings_list = []
        user_ids = []
        for s in face_templates:
            if s.face_template is not None:
                emb = from_blob(s.face_template)
                embeddings_list.append(emb)
                user_ids.append(s.user_id)
        if embeddings_list:
            # shape: (num_users, 512)
            user_embeddings = np.stack(embeddings_list)
    finally:
        db.close()


def find_best_match(new_embedding: np.ndarray):
    if user_embeddings.shape[0] == 0:
        return None, 0.0

    # Cosine similarity between new_embedding and all stored embeddings
    sims = cosine_similarity(new_embedding.reshape(1, -1), user_embeddings)[0]

    print("similarity:", sims)

    best_idx = np.argmax(sims)
    return user_ids[best_idx], float(sims[best_idx])
