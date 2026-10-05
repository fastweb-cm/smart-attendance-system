# import os
# from deepface import DeepFace


# def preload():
#     print("Baking facial recognition models into Docker layer...")
#     # Explicitly invoking a build triggers DeepFace to download and verify the model weights
#     try:
#         DeepFace.build_model(model_name="ArcFace")
#         print("ArcFace weights successfully cached.")
#     except Exception as e:
#         print(f"Failed to cache weights during build: {e}")


# if __name__ == "__main__":
#     preload()

from deepface import DeepFace
import os
import tensorflow as tf

# Suppress CUDA warnings & force CPU
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

# Set explicit home directory for DeepFace weights inside /app
os.environ["DEEPFACE_HOME"] = "/app/.deepface"


def preload():
    print("Baking facial recognition models into Docker layer...")
    try:
        DeepFace.build_model(model_name="ArcFace")
        print("ArcFace weights successfully cached at /app/.deepface")
    except Exception as e:
        print(f"Failed to cache weights during build: {e}")


if __name__ == "__main__":
    preload()
