from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Scan, User

dash_bp = Blueprint('dashboard', __name__)

@dash_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    identity = get_jwt_identity()
    user = User.query.get(identity['id'])
    
    recent_scans = Scan.query.filter_by(user_id=user.id)\
        .order_by(Scan.created_at.desc()).limit(10).all()
    
    stats = {
        'total_scans': user.total_scans,
        'scans_today': user.scans_today,
        'high_risk': len([s for s in recent_scans if s.risk_score > 75]),
        'avg_risk': sum(s.risk_score for s in recent_scans) / max(len(recent_scans), 1)
    }
    
    return jsonify({
        'user': user.to_dict(),
        'stats': stats,
        'recent_scans': [s.to_dict() for s in recent_scans]
    })

@dash_bp.route('/scans/<int:scan_id>', methods=['GET'])
@jwt_required()
def scan_details(scan_id):
    identity = get_jwt_identity()
    scan = Scan.query.filter_by(id=scan_id, user_id=identity['id']).first()
    
    if not scan:
        return jsonify({'error': 'Scan not found'}), 404
    
    return jsonify(scan.get_results())