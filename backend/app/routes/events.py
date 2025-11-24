from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import Event, EventParticipant, ClubMember, Club
from datetime import datetime

bp = Blueprint('events', __name__, url_prefix='/events')


def is_club_exec(user_uid, club_uid):
    return ClubMember.query.filter_by(user_uid=user_uid, club_uid=club_uid, type='exec').first() is not None


@bp.route('/', methods=['POST'])
@jwt_required()
def create_event():
    data = request.get_json() or {}
    name = data.get('name')
    start = data.get('start_datetime')
    end = data.get('end_datetime')
    event_type = data.get('type')
    status = data.get('status', 'scheduled')
    club_uid = data.get('club_uid')

    if not name or not start or not event_type:
        return jsonify({'msg': 'name, start_datetime and type are required'}), 400

    # If event belongs to a club, only execs can create
    uid = get_jwt_identity()
    if club_uid:
        club = Club.query.get(club_uid)
        if not club:
            return jsonify({'msg': 'club not found'}), 404
        if not is_club_exec(uid, club_uid):
            return jsonify({'msg': 'only club execs can create events for this club'}), 403

    try:
        start_dt = datetime.fromisoformat(start)
        end_dt = datetime.fromisoformat(end) if end else None
    except Exception:
        return jsonify({'msg': 'invalid datetime format, use ISO format'}), 400

    event = Event(name=name, start_datetime=start_dt, end_datetime=end_dt, description=data.get('description'), location=data.get('location'), limit=data.get('limit'), type=event_type, status=status, club_uid=club_uid)
    db.session.add(event)
    db.session.commit()
    return jsonify({'uid': event.uid, 'name': event.name}), 201


@bp.route('/<event_uid>', methods=['GET'])
def get_event(event_uid):
    event = Event.query.get(event_uid)
    if not event:
        return jsonify({'msg': 'event not found'}), 404
    return jsonify({'uid': event.uid, 'name': event.name, 'start_datetime': event.start_datetime.isoformat(), 'end_datetime': event.end_datetime.isoformat() if event.end_datetime else None, 'description': event.description, 'location': event.location, 'limit': event.limit, 'type': event.type, 'status': event.status, 'club_uid': event.club_uid}), 200


@bp.route('/<event_uid>', methods=['PUT'])
@jwt_required()
def update_event(event_uid):
    uid = get_jwt_identity()
    event = Event.query.get(event_uid)
    if not event:
        return jsonify({'msg': 'event not found'}), 404

    if event.club_uid and not is_club_exec(uid, event.club_uid):
        return jsonify({'msg': 'only club execs can edit this event'}), 403

    data = request.get_json() or {}
    if 'name' in data:
        event.name = data.get('name')
    if 'start_datetime' in data:
        try:
            event.start_datetime = datetime.fromisoformat(data.get('start_datetime'))
        except Exception:
            return jsonify({'msg': 'invalid start_datetime format'}), 400
    if 'end_datetime' in data:
        try:
            event.end_datetime = datetime.fromisoformat(data.get('end_datetime')) if data.get('end_datetime') else None
        except Exception:
            return jsonify({'msg': 'invalid end_datetime format'}), 400
    for fld in ('description', 'location', 'limit', 'type', 'status'):
        if fld in data:
            setattr(event, fld, data.get(fld))
    db.session.commit()
    return jsonify({'msg': 'updated'}), 200


@bp.route('/<event_uid>/join', methods=['POST'])
@jwt_required()
def join_event(event_uid):
    uid = get_jwt_identity()
    event = Event.query.get(event_uid)
    if not event:
        return jsonify({'msg': 'event not found'}), 404

    # If event linked to a club, only club members can join
    if event.club_uid:
        membership = ClubMember.query.filter_by(user_uid=uid, club_uid=event.club_uid).first()
        if not membership:
            return jsonify({'msg': 'must be a club member to join this event'}), 403

    existing = EventParticipant.query.filter_by(user_uid=uid, event_uid=event_uid).first()
    if existing:
        return jsonify({'msg': 'already joined'}), 400

    participant = EventParticipant(user_uid=uid, event_uid=event_uid, type='inperson' if event.type == 'in-person' else 'online')
    db.session.add(participant)
    db.session.commit()
    return jsonify({'msg': 'joined'}), 201
