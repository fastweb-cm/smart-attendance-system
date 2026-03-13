from deepface import DeepFace
import numpy as np
from app.services.embedding_service import to_blob

model = None


def load_model_info():
    """
    Load model info
    """

    global model
    model = DeepFace.build_model("VGG-Face")


def extract_embedding(image):

    result = DeepFace.represent(
        img_path=image,
        model_name="VGG-Face",
        detector_backend="retinaface",
        enforce_detection=True
    )

    if len(result) != 1:
        raise Exception("Exactly one face required")

    vector = result[0]["embedding"]

    return np.array(vector, dtype=np.float32)
