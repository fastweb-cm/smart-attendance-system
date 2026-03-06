import numpy as np


def to_blob(np_array: np.ndarray) -> bytes:
    """
    Converts a numpy array from face embeddings to a bytes for storage in DB 
    """
    return np_array.tobytes()


def from_blob(blob: bytes) -> np.ndarray:
    """
    Converts a stored BLOB (binary) from DB into a numpy array for comparison.
    """
    return np.frombuffer(blob, dtype=np.float32)
