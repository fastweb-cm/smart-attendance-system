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
    global model

    result = DeepFace.represent(
        img_path=image,
        model_name=model,
        detector_backend="retinaface"
    )

    vector = result[0]["embedding"]
    return np.array(vector, dtype=np.float32)
