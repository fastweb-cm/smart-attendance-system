import os
from deepface import DeepFace


def preload():
    print("Baking facial recognition models into Docker layer...")
    # Explicitly invoking a build triggers DeepFace to download and verify the model weights
    try:
        DeepFace.build_model(model_name="ArcFace")
        print("ArcFace weights successfully cached.")
    except Exception as e:
        print(f"Failed to cache weights during build: {e}")


if __name__ == "__main__":
    preload()
