FROM python:3.11-slim

WORKDIR /app

# System dependencies: Added libcairo2-dev and cmake for PyGObject/pycairo compilation
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
    libcairo2-dev \
    cmake \
    fprintd \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Use a bind cache mount so pip retains downloaded wheels even if the build fails later
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --default-timeout=5000 -r requirements.txt

# Copy and run preload script to bake weights into the image
COPY preload_models.py .
RUN python preload_models.py

COPY . .

CMD ["python", "run.py"]
