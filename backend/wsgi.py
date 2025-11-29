"""WSGI entrypoint for Gunicorn/docker.

This module exposes a top-level `app` object that Gunicorn can import.
It calls the app factory defined in `app/__init__.py`.
"""
from app import create_app

app = create_app()
