import pytest


class DummyResp:
    def __init__(self, status_code=200, json_data=None, text=''):
        self.status_code = status_code
        self._json = json_data or {'secure_url': 'https://res.cloudinary.com/test/image/upload/v1/test.jpg'}
        self.text = text

    def json(self):
        return self._json


def test_upload_media_success(monkeypatch, client):
    # register user
    r = client.post('/auth/register', json={'name': 'M1', 'email': 'm1@example.com', 'password': 'pw'})
    token = r.get_json()['access_token']

    # mock requests.post used in media.upload
    import requests

    def fake_post(url, data=None, files=None, timeout=30):
        return DummyResp(status_code=200, json_data={'secure_url': 'https://cdn.example/test.jpg'})

    monkeypatch.setattr('requests.post', fake_post)

    import io

    data = {
        'file': (io.BytesIO(b'abc'), 'test.png')
    }
    resp = client.post('/media/upload', data=data, headers={'Authorization': f'Bearer {token}'}, content_type='multipart/form-data')
    assert resp.status_code == 200
    j = resp.get_json()
    assert 'url' in j and j['url'].startswith('https://')


def test_upload_media_missing_file(client):
    r = client.post('/auth/register', json={'name': 'M2', 'email': 'm2@example.com', 'password': 'pw'})
    token = r.get_json()['access_token']
    resp = client.post('/media/upload', data={}, headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 400
    assert resp.get_json().get('msg') == 'file is required'


def test_get_media_not_found(client):
    # No GET route for media metadata implemented; hitting a generic route should return 404
    r = client.get('/media/1')
    assert r.status_code in (404, 405)
