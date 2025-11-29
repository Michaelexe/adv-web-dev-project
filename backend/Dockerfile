FROM python:3.11-slim

# Keep image lean and deterministic
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system deps required for some Python packages (libpq for psycopg2 if needed)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       gcc \
       libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt ./

# Upgrade pip and install Python deps (install gunicorn here so we don't have to change requirements)
RUN pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt gunicorn

# Copy application source
COPY . /app

# Ensure file permissions (optional)
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser || true
RUN chown -R appuser:appgroup /app || true

USER appuser

# Expose port used by the Flask app
EXPOSE 5000

# Use the wsgi module which calls create_app()
ENV FLASK_ENV=production

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "wsgi:app"]
