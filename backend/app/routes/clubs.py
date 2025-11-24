from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import Club, ClubMember, User
from datetime import datetime

bp = Blueprint('clubs', __name__, url_prefix='/clubs')


def is_club_exec(user_uid, club_uid):
    return ClubMember.query.filter_by(user_uid=user_uid, club_uid=club_uid, type='exec').first() is not None


@bp.route('/', methods=['POST'])
@jwt_required()
def create_club():
    data = request.get_json() or {}
    name = data.get('name')
    description = data.get('description')
    budget = data.get('budget', 500)
    social_links = data.get('social_links')
    if not name:
        return jsonify({'msg': 'name required'}), 400

    club = Club(name=name, description=description, budget=budget, social_links=social_links)
    db.session.add(club)
    db.session.commit()

    # make creator an exec
    uid = get_jwt_identity()
    member = ClubMember(user_uid=uid, club_uid=club.uid, type='exec', role='founder', joined_at=datetime.utcnow())
    db.session.add(member)
    db.session.commit()

    return jsonify({'uid': club.uid, 'name': club.name}), 201


@bp.route('/<club_uid>', methods=['GET'])
def get_club(club_uid):
    club = Club.query.get(club_uid)
    if not club:
        return jsonify({'msg': 'club not found'}), 404
    return jsonify({'uid': club.uid, 'name': club.name, 'description': club.description, 'budget': str(club.budget), 'social_links': club.social_links}), 200


@bp.route('/<club_uid>', methods=['PUT'])
@jwt_required()
def update_club(club_uid):
    uid = get_jwt_identity()
    if not is_club_exec(uid, club_uid):
        return jsonify({'msg': 'only club execs can edit club info'}), 403

    club = Club.query.get(club_uid)
    if not club:
        return jsonify({'msg': 'club not found'}), 404
    data = request.get_json() or {}
    club.name = data.get('name', club.name)
    club.description = data.get('description', club.description)
    club.budget = data.get('budget', club.budget)
    club.social_links = data.get('social_links', club.social_links)
    db.session.commit()
    return jsonify({'msg': 'updated'}), 200


@bp.route('/<club_uid>/join', methods=['POST'])
@jwt_required()
def join_club(club_uid):
    uid = get_jwt_identity()
    club = Club.query.get(club_uid)
    if not club:
        return jsonify({'msg': 'club not found'}), 404

    # don't duplicate membership
    existing = ClubMember.query.filter_by(user_uid=uid, club_uid=club_uid).first()
    if existing:
        return jsonify({'msg': 'already a member'}), 400

    member = ClubMember(user_uid=uid, club_uid=club_uid, type='member')
    db.session.add(member)
    db.session.commit()
    return jsonify({'msg': 'joined'}), 201


@bp.route('/<club_uid>/members', methods=['GET'])
def club_members(club_uid):
    members = ClubMember.query.filter_by(club_uid=club_uid).all()
    out = []
    for m in members:
        user = User.query.get(m.user_uid)
        out.append({'user_uid': m.user_uid, 'name': user.name if user else None, 'type': m.type, 'role': m.role})
    return jsonify(out), 200


@bp.route('/my-clubs', methods=['GET'])
@jwt_required()
def get_my_clubs():
    """Get all clubs where the current user is an executive"""
    uid = get_jwt_identity()
    memberships = ClubMember.query.filter_by(user_uid=uid, type='exec').all()
    
    clubs = []
    for membership in memberships:
        club = Club.query.get(membership.club_uid)
        if club:
            clubs.append({
                'uid': club.uid,
                'name': club.name,
                'role': membership.role,
                'budget': str(club.budget)
            })
    
    return jsonify(clubs), 200
