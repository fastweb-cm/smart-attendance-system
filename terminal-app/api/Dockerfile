FROM python:3.11-slim

WORKDIR /app

# System dependencies: Added libfprint, libusb, and build tools for hardware access
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libusb-1.0-0-dev \
    libfprint-2-dev \
    libfprint-2-2 \
    gir1.2-fprint-2.0 \
    python3-gi \
    python3-gi-cairo \
    gobject-introspection \
    libgirepository1.0-dev \
    fprintd \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --default-timeout=5000 tensorflow==2.20.0
RUN pip install --no-cache-dir --default-timeout=5000 opencv-python==4.13.0.92
RUN pip install --no-cache-dir --default-timeout=5000 cryptography==42.0.5

COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=5000 -r requirements.txt

# Copy and run preload script to bake weights into the image
COPY preload_models.py .
RUN python preload_models.py

COPY . .

CMD ["python", "run.py"]
