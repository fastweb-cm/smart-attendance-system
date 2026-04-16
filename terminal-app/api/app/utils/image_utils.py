import base64
import numpy as np
import cv2


def base64_to_image(base64_string: str):
    # If there's a comma, assume the first part is a header
    if "," in base64_string:
        header, encoded = base64_string.split(",", 1)
    else:
        encoded = base64_string  # raw base64, no header

    try:
        img_bytes = base64.b64decode(encoded)
    except Exception as e:
        raise ValueError("Invalid base64 string") from e

    np_arr = np.frombuffer(img_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Could not decode image from base64")

    return image
