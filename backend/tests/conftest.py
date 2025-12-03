import os
import io
import pytest
from flask import url_for

# Ensure tests use in-memory sqlite
os.environ.setdefault('DATABASE_URL', 'sqlite:///:memory:')
os.environ.setdefault('JWT_SECRET_KEY', 'test-secret')

from app import create_app, db as _db
from app.models import User, Club, ClubMember, Event
from flask_jwt_extended import create_access_token


@pytest.fixture(scope='session')
def app():
    app = create_app()
    app.config.update({'TESTING': True})
    # ensure Cloudinary env present for upload route
    os.environ.setdefault('CLOUDINARY_CLOUD_NAME', 'test')
    os.environ.setdefault('CLOUDINARY_UPLOAD_PRESET', 'preset')
    with app.app_context():
        _db.create_all()
    yield app
    # teardown
    with app.app_context():
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db(app):
    return _db


def create_user_model(name='Test User', email='user@example.com', password='password'):
    u = User(name=name, email=email)
    u.set_password(password)
    _db.session.add(u)
    _db.session.commit()
    return u


def create_club_model(name='Test Club'):
    c = Club(name=name, description='desc')
    _db.session.add(c)
    _db.session.commit()
    return c


def create_token_for(user_uid):
    return create_access_token(identity=user_uid)


@pytest.fixture
def helpers(app, db):
    class H:
        def create_user(self, name='Test User', email='user@example.com', password='password'):
            return create_user_model(name=name, email=email, password=password)

        def create_club(self, name='Test Club'):
            return create_club_model(name=name)

        def token_for(self, user):
            return create_token_for(user.uid)

        def auth_headers(self, token):
            return {'Authorization': f'Bearer {token}'}

        def upload_file(self, client, token, filename='test.png', content=b'abc'):
            data = {
                'file': (io.BytesIO(content), filename)
            }
            headers = self.auth_headers(token)
            return client.post('/media/upload', data=data, headers=headers, content_type='multipart/form-data')

    return H()
