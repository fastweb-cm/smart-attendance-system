FROM python:3.11-slim

WORKDIR /app

# Updated dependencies for OpenCV and general system stability
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --default-timeout=1000 tensorflow==2.20.0
RUN pip install --no-cache-dir --default-timeout=1000 opencv-python==4.13.0.92
RUN pip install --no-cache-dir --default-timeout=1000 cryptography==42.0.5

COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=100 -r requirements.txt

COPY . .

CMD ["python", "run.py"]
