from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import faiss
from sqlalchemy.orm import Session
from app.services.embedding_service import from_blob
from app.db.models.biometric_profile import BiometricProfile
from app.db.session import SessionLocal

# Prepare a global cache
user_ids = []
faiss_index = None


def load_users_into_memory():
    global user_ids, faiss_index
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
            embeddings = np.stack(embeddings_list).astype("float32")

            # normalize for cosine similary
            faiss.normalize_L2(embeddings)

            # reshape to 512
            dimension = embeddings.shape[1]

            # use inner product (cosine similarity)
            faiss_index = faiss.IndexFlatIP(dimension)

            faiss_index.add(embeddings)
    finally:
        db.close()


def find_best_match(new_embedding: np.ndarray):
    global faiss_index, user_ids

    if faiss_index is None or faiss_index.ntotal == 0:
        return None, 0.0

    # reshape and normalize
    query = new_embedding.reshape(1, -1).astype("float32")
    faiss.normalize_L2(query)

    distances, indices = faiss_index.search(query, k=1)

    best_idx = indices[0][0]
    best_score = distances[0][0]

    return user_ids[best_idx], float(best_score)
