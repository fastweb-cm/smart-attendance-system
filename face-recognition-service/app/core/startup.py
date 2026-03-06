from contextlib import asynccontextmanager
import numpy as np
from app.services.attendance_service import load_users_into_memory

# Global cache
user_biometric_cache: dict[int, np.ndarray] = {}
model_info: dict[str, str] = {}


def load_model_info():
    """
    Load model info
    """

    global model_info
    model_info["model_name"] = "Arcface"
    model_info["threshold"] = 0.8

# Lifespan context for FastAPI


@asynccontextmanager
async def startup_lifespan(app):
    """
    This handles startup tasks.
    """

    print("Loading users face templates into memory...")
    load_users_into_memory()

    print("Loading model info...")
    load_model_info()

    yield  # control returns to FastAPI app

    # Shutdown code
    print("App shutting down...")
