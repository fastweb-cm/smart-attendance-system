from deepface import DeepFace
import numpy as np
from app.services.embedding_service import to_blob

model = None


def load_model_info():
    """
    Load model info
    """

    global model
    model = DeepFace.build_model("ArcFace")


def extract_embedding(images):

    results = DeepFace.represent(
        img_path=images,
        model_name="ArcFace",
        detector_backend="skip",
        enforce_detection=False
    )

    if not isinstance(images, list):
        results = [results]

    embeddings = []

    for r in results:
        if isinstance(r, list):
            r = r[0]

        embeddings.append(
            np.array(r["embedding"], dtype=np.float32)
        )

    return embeddings
