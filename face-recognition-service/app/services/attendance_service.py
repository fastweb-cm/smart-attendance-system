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
    """
    Load all stored user face embeddings from database 
    normalize them
    put them into FAISS index for fast searching
    """
    global user_ids, faiss_index
    db = SessionLocal()  # connect to db
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
            # converts list into a matrix(stacks each embeddings as rows in a new 2D array)
            embeddings = np.stack(embeddings_list).astype("float32")

            # normalize for cosine similary
            faiss.normalize_L2(embeddings)

            # reshape to 512
            dimension = embeddings.shape[1]

            quantifier = faiss.IndexFlatIP(dimension)  # creates quantifier

            # create IVF index
            nlist = max(1, min(50, len(embeddings_list)))  # number of clusters

            # create IVF index
            faiss_index = faiss.IndexIVFFlat(
                quantifier,
                dimension,
                nlist,
                faiss.METRIC_INNER_PRODUCT
            )

            # train the index
            faiss_index.train(embeddings)

            faiss_index.add(embeddings)  # store all users in FAISS
    finally:
        db.close()


def find_best_match(new_embedding: np.ndarray):
    """
    Take a new face embedding 
    compare it with stored users 
    return the closest match
    """
    global faiss_index, user_ids

    if faiss_index is None or faiss_index.ntotal == 0:
        return None, 0.0

    # reshape new embeddings from [512] to [[512]] since FAISS expects a 2D array
    query = new_embedding.reshape(1, -1).astype("float32")

    # normalize (make the vector length 1)
    faiss.normalize_L2(query)

    # compare query with all stored embeddings and returns the best match only
    distances, indices = faiss_index.search(query, k=1)

    best_idx = indices[0][0]
    best_score = distances[0][0]

    return user_ids[best_idx], float(best_score)
