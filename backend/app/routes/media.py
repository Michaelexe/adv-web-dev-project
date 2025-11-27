from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import os
import requests

bp = Blueprint('media', __name__, url_prefix='/media')


@bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_media():
    """Upload a file to Cloudinary using unsigned upload preset.

    Requires env vars: CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET
    Returns JSON: { url: <uploaded_url> }
    """
    file = request.files.get('file')
    if not file:
        return jsonify({'msg': 'file is required'}), 400

    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')

    # Allow selecting different unsigned presets for different upload types
    # Priority: preset_type -> form-provided upload_preset -> env default
    preset_type = request.form.get('preset_type') or request.form.get('type')
    form_upload_preset = request.form.get('upload_preset')

    upload_preset = None
    if preset_type:
        if preset_type.lower() == 'logo':
            upload_preset = os.environ.get('CLOUDINARY_UPLOAD_PRESET_LOGO')
        elif preset_type.lower() == 'banner':
            upload_preset = os.environ.get('CLOUDINARY_UPLOAD_PRESET_BANNER')
        else:
            # If an unknown preset_type is provided, try to use a direct upload_preset field
            upload_preset = os.environ.get('CLOUDINARY_UPLOAD_PRESET')

    if not upload_preset and form_upload_preset:
        upload_preset = form_upload_preset

    # final fallback to the generic env var
    if not upload_preset:
        upload_preset = os.environ.get('CLOUDINARY_UPLOAD_PRESET')

    if not cloud_name or not upload_preset:
        return jsonify({'msg': 'cloudinary config not set (CLOUDINARY_CLOUD_NAME and an upload preset are required)'}), 500

    url = f"https://api.cloudinary.com/v1_1/{cloud_name}/auto/upload"
    files = {'file': (file.filename, file.stream, file.mimetype)}
    data = {'upload_preset': upload_preset}

    try:
        resp = requests.post(url, data=data, files=files, timeout=30)
    except Exception as e:
        return jsonify({'msg': 'upload failed', 'error': str(e)}), 500

    if resp.status_code != 200:
        return jsonify({'msg': 'upload failed', 'error': resp.text}), resp.status_code

    result = resp.json()
    return jsonify({'url': result.get('secure_url')}), 200
