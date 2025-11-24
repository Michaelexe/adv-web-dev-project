from flask import Blueprint, request, jsonify
from flask import current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from .. import db
from ..models import User

bp = Blueprint('auth', __name__, url_prefix='/auth')


@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    if not (name and email and password):
        return jsonify({'msg': 'name, email and password required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'msg': 'email already registered'}), 400

    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=user.uid)
    return jsonify({'access_token': access_token, 'uid': user.uid}), 201


@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    if not (email and password):
        return jsonify({'msg': 'email and password required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'msg': 'invalid credentials'}), 401

    access_token = create_access_token(identity=user.uid)
    return jsonify({'access_token': access_token, 'uid': user.uid}), 200


@bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if not user:
        return jsonify({'msg': 'user not found'}), 404
    return jsonify({'uid': user.uid, 'name': user.name, 'email': user.email}), 200
