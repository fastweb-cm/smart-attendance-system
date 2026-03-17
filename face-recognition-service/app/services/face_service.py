from deepface import DeepFace
import numpy as np

model = None


def load_model_info():
    """
    Load model once at startup
    """
    global model
    model = DeepFace.build_model("ArcFace")


def extract_embedding(images):
    """
    Extract embeddings from already cropped face images
    """

    embeddings = []

    for img in images:
        try:
            result = DeepFace.represent(
                img_path=img,
                model_name="ArcFace",
                # VERY IMPORTANT (we already cropped)
                detector_backend="skip",
                enforce_detection=False
            )

            if isinstance(result, list):
                result = result[0]

            embedding = np.array(result["embedding"], dtype=np.float32)

            # normalize embedding (critical for cosine similarity)
            norm = np.linalg.norm(embedding)
            if norm == 0:
                continue

            embedding = embedding / norm

            embeddings.append(embedding)

        except Exception as e:
            print("Skipping image (embedding failed):", str(e))

    return embeddings
