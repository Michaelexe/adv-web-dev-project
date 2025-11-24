import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv

# Load .env into environment if present
load_dotenv()

# Initialize extensions (actual init_app called in create_app)
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()


def create_app():
    """Create and configure Flask app"""
    app = Flask(__name__)

    # Load config from env
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        # fallback to a local sqlite file for development
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dev.db'

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret')
    # JWT config
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', app.config['SECRET_KEY'])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}}, supports_credentials=True)

    # Register blueprints
    from .routes import auth as auth_bp
    from .routes import clubs as clubs_bp
    from .routes import events as events_bp
    from .routes import calendar as calendar_bp

    app.register_blueprint(auth_bp.bp)
    app.register_blueprint(clubs_bp.bp)
    app.register_blueprint(events_bp.bp)
    app.register_blueprint(calendar_bp.bp)

    # Import models so they are registered with SQLAlchemy
    with app.app_context():
        from . import models  # noqa: F401
        # Create all tables if they don't exist
        db.create_all()

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='127.0.0.1', port=5000)