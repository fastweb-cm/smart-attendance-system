from contextlib import asynccontextmanager
import numpy as np
from app.services.attendance_service import load_users_into_memory
from app.services.face_service import load_model_info

from app.db.models.users import User
from app.db.models.biometric_profile import BiometricProfile

# Global cache
# user_biometric_cache: dict[int, np.ndarray] = {}
model_info: dict[str, str] = {}


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
