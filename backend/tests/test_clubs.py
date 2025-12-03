import pytest
from app.models import ClubMember


def test_create_and_get_club(client):
    r = client.post('/auth/register', json={'name': 'Founder', 'email': 'founder@example.com', 'password': 'pw'})
    token = r.get_json()['access_token']

    # create club
    resp = client.post('/clubs/', json={'name': 'Chess Club', 'description': 'fun'}, headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 201
    club_uid = resp.get_json()['uid']

    # get club
    g = client.get(f'/clubs/{club_uid}')
    assert g.status_code == 200
    data = g.get_json()
    assert data['name'] == 'Chess Club'


def test_get_club_not_found(client):
    g = client.get('/clubs/nonexistent')
    assert g.status_code == 404


def test_club_members_list(client):
    r = client.post('/auth/register', json={'name': 'F2', 'email': 'f2@example.com', 'password': 'pw'})
    token = r.get_json()['access_token']
    resp = client.post('/clubs/', json={'name': 'Robotics'}, headers={'Authorization': f'Bearer {token}'})
    club_uid = resp.get_json()['uid']

    members = client.get(f'/clubs/{club_uid}/members')
    assert members.status_code == 200
    arr = members.get_json()
    assert isinstance(arr, list)
    assert any(m.get('type') == 'exec' for m in arr)
