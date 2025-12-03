import pytest


def test_add_exec_success_and_promote(client):
    # founder creates club
    r = client.post('/auth/register', json={'name': 'Found', 'email': 'founder2@example.com', 'password': 'pw'})
    founder_token = r.get_json()['access_token']

    club = client.post('/clubs/', json={'name': 'Drama'}, headers={'Authorization': f'Bearer {founder_token}'})
    club_uid = club.get_json()['uid']

    # create another user to be exec
    client.post('/auth/register', json={'name': 'ExecUser', 'email': 'exec@example.com', 'password': 'pw'})

    # founder adds exec
    resp = client.post(f'/clubs/{club_uid}/execs', json={'email': 'exec@example.com', 'role': 'vice-president'}, headers={'Authorization': f'Bearer {founder_token}'})
    assert resp.status_code in (200, 201)
    data = resp.get_json()
    assert 'user_uid' in data


def test_add_exec_forbidden_for_normal_user(client):
    # create normal user and a club by someone else
    client.post('/auth/register', json={'name': 'Owner', 'email': 'owner@example.com', 'password': 'pw'})
    owner_token = client.post('/auth/login', json={'email': 'owner@example.com', 'password': 'pw'}).get_json()['access_token']
    club = client.post('/clubs/', json={'name': 'Glee'}, headers={'Authorization': f'Bearer {owner_token}'})
    club_uid = club.get_json()['uid']

    # normal user
    client.post('/auth/register', json={'name': 'Normal', 'email': 'normal@example.com', 'password': 'pw'})
    normal_token = client.post('/auth/login', json={'email': 'normal@example.com', 'password': 'pw'}).get_json()['access_token']

    resp = client.post(f'/clubs/{club_uid}/execs', json={'email': 'normal@example.com', 'role': 'vice-president'}, headers={'Authorization': f'Bearer {normal_token}'})
    assert resp.status_code == 403


def test_add_exec_invalid_email(client):
    r = client.post('/auth/register', json={'name': 'Owner2', 'email': 'owner2@example.com', 'password': 'pw'})
    token = r.get_json()['access_token']
    club = client.post('/clubs/', json={'name': 'Jazz'}, headers={'Authorization': f'Bearer {token}'})
    club_uid = club.get_json()['uid']

    resp = client.post(f'/clubs/{club_uid}/execs', json={'email': 'noone@missing.com', 'role': 'vp'}, headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 404


def test_remove_exec_success_and_forbidden(client):
    r = client.post('/auth/register', json={'name': 'F3', 'email': 'founder3@example.com', 'password': 'pw'})
    founder_token = r.get_json()['access_token']
    club = client.post('/clubs/', json={'name': 'Surf'}, headers={'Authorization': f'Bearer {founder_token}'})
    club_uid = club.get_json()['uid']

    # create exec user and add
    client.post('/auth/register', json={'name': 'Exec2', 'email': 'exec2@example.com', 'password': 'pw'})
    add = client.post(f'/clubs/{club_uid}/execs', json={'email': 'exec2@example.com', 'role': 'vp'}, headers={'Authorization': f'Bearer {founder_token}'})
    assert add.status_code in (200, 201)
    user_uid = add.get_json().get('user_uid')

    # remove by founder
    rem = client.delete(f'/clubs/{club_uid}/execs/{user_uid}', headers={'Authorization': f'Bearer {founder_token}'})
    assert rem.status_code == 200

    # forbidden: normal user tries to remove
    client.post('/auth/register', json={'name': 'Norm2', 'email': 'norm2@example.com', 'password': 'pw'})
    norm_token = client.post('/auth/login', json={'email': 'norm2@example.com', 'password': 'pw'}).get_json()['access_token']
    bad = client.delete(f'/clubs/{club_uid}/execs/{user_uid}', headers={'Authorization': f'Bearer {norm_token}'})
    assert bad.status_code in (403, 404)
