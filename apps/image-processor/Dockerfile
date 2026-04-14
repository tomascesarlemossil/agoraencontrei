# Dockerfile for the image-processor microservice (FastAPI + Pillow + PyMuPDF).
# Used by Railway when the service's root directory is set to
# `apps/image-processor`.
#
# Intentionally tiny — `python:3.12-slim` is under 150 MB, and the only
# system libraries we install are the ones needed by Pillow for JPEG/PNG/
# TIFF and by PyMuPDF for PDF rasterisation.

FROM python:3.12-slim

# Native libs required by the Python wheels:
#   - libjpeg/png/tiff/webp → Pillow image decoding
#   - libxrender/libxext    → PyMuPDF needs a couple of X11 libs even in
#                             headless mode (not to display anything, just
#                             to satisfy shared-library loads).
# `--no-install-recommends` keeps the image small; ca-certificates is
# needed so `requests` can reach S3/Cloudinary over HTTPS.
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        libjpeg62-turbo \
        libpng16-16 \
        libtiff6 \
        libwebp7 \
        libxrender1 \
        libxext6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first so the wheel download stays in a cached layer
# and subsequent code-only changes rebuild fast.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application source.
COPY . ./

# Railway sets $PORT dynamically; default to 3200 for local runs.
ENV PORT=3200
EXPOSE 3200

# `main:app` = FastAPI instance exported from main.py. `--host 0.0.0.0`
# is mandatory so Railway's proxy can reach the container.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-3200}"]
