import pytest


def test_register_success(client):
    resp = client.post('/auth/register', json={'name': 'Alice', 'email': 'alice@example.com', 'password': 'pass'})
    assert resp.status_code == 201
    data = resp.get_json()
    assert 'access_token' in data and 'uid' in data


def test_register_missing_fields(client):
    resp = client.post('/auth/register', json={'email': 'a@b.com'})
    assert resp.status_code == 400
    data = resp.get_json()
    assert 'msg' in data


def test_register_duplicate(client):
    client.post('/auth/register', json={'name': 'Bob', 'email': 'bob@example.com', 'password': 'pass'})
    resp = client.post('/auth/register', json={'name': 'Bob', 'email': 'bob@example.com', 'password': 'pass'})
    assert resp.status_code == 400
    assert resp.get_json().get('msg') == 'email already registered'


def test_login_success_and_wrong_password(client):
    client.post('/auth/register', json={'name': 'Carl', 'email': 'carl@example.com', 'password': 'secret'})
    resp = client.post('/auth/login', json={'email': 'carl@example.com', 'password': 'secret'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'access_token' in data

    bad = client.post('/auth/login', json={'email': 'carl@example.com', 'password': 'bad'})
    assert bad.status_code == 401
    assert bad.get_json().get('msg') == 'invalid credentials'


def test_login_unknown_user(client):
    resp = client.post('/auth/login', json={'email': 'noone@example.com', 'password': 'x'})
    assert resp.status_code == 401
    assert resp.get_json().get('msg') == 'invalid credentials'


def test_me_requires_token(client):
    resp = client.get('/auth/me')
    assert resp.status_code == 401


def test_me_with_token(client):
    reg = client.post('/auth/register', json={'name': 'Dana', 'email': 'dana@example.com', 'password': 'pw'})
    token = reg.get_json()['access_token']
    resp = client.get('/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get('email') == 'dana@example.com'
