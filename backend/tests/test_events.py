import pytest
from datetime import datetime, timedelta


def test_create_event_validation_and_success(client):
    r = client.post('/auth/register', json={'name': 'EOwner', 'email': 'eowner@example.com', 'password': 'pw'})
    token = r.get_json()['access_token']

    # missing fields
    resp = client.post('/events/', json={'name': 'Bad Event'}, headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 400

    # success (public event)
    start = (datetime.utcnow() + timedelta(days=1)).isoformat()
    resp2 = client.post('/events/', json={'name': 'Party', 'start_datetime': start, 'type': 'in-person'}, headers={'Authorization': f'Bearer {token}'})
    assert resp2.status_code == 201
    event_uid = resp2.get_json().get('uid')

    # get event
    g = client.get(f'/events/{event_uid}')
    assert g.status_code == 200
    assert g.get_json().get('name') == 'Party'


def test_get_event_not_found(client):
    g = client.get('/events/nonexistent')
    assert g.status_code == 404


def test_update_delete_event_permissions(client):
    # founder creates club and event linked to club
    r = client.post('/auth/register', json={'name': 'OwnerE', 'email': 'ownere@example.com', 'password': 'pw'})
    owner_token = r.get_json()['access_token']
    club = client.post('/clubs/', json={'name': 'C1'}, headers={'Authorization': f'Bearer {owner_token}'})
    club_uid = club.get_json()['uid']

    start = (datetime.utcnow() + timedelta(days=2)).isoformat()
    ev = client.post('/events/', json={'name': 'Club Event', 'start_datetime': start, 'type': 'in-person', 'club_uid': club_uid}, headers={'Authorization': f'Bearer {owner_token}'})
    assert ev.status_code == 201
    event_uid = ev.get_json()['uid']

    # normal user cannot update
    client.post('/auth/register', json={'name': 'U1', 'email': 'u1@example.com', 'password': 'pw'})
    u_token = client.post('/auth/login', json={'email': 'u1@example.com', 'password': 'pw'}).get_json()['access_token']
    bad = client.put(f'/events/{event_uid}', json={'name': 'Hacked'}, headers={'Authorization': f'Bearer {u_token}'})
    assert bad.status_code == 403

    # owner/exec updates
    ok = client.put(f'/events/{event_uid}', json={'name': 'Updated Event'}, headers={'Authorization': f'Bearer {owner_token}'})
    assert ok.status_code == 200

    # delete unauthorized
    baddel = client.delete(f'/events/{event_uid}', headers={'Authorization': f'Bearer {u_token}'})
    assert baddel.status_code == 403

    # delete by owner
    d = client.delete(f'/events/{event_uid}', headers={'Authorization': f'Bearer {owner_token}'})
    assert d.status_code == 200

    # deleting again returns 404
    d2 = client.delete(f'/events/{event_uid}', headers={'Authorization': f'Bearer {owner_token}'})
    assert d2.status_code == 404
