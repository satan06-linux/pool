from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Scan, User
from engines.security_scanner import SecurityScanner
from utils.limits import check_scan_limit

paid_bp = Blueprint('paid_tools', __name__)
scanner = SecurityScanner()

@paid_bp.route('/full-security-scan', methods=['POST'])
@jwt_required()
def full_security_scan():
    identity = get_jwt_identity()
    user = User.query.get(identity['id'])
    
    if not check_scan_limit(user):
        return jsonify({
            'error': f'Daily scan limit reached for {user.tier} plan',
            'limit': user.scans_today,
            'upgrade': True
        }), 402
    
    target = request.json.get('url', '').strip()
    if not target.startswith(('http://', 'https://')):
        target = 'https://' + target
    
    # Run comprehensive scan
    results = scanner.comprehensive_audit(target)
    
    # Save scan
    scan = Scan(
        user_id=user.id,
        target=target,
        scan_type='comprehensive',
        results=str(results),
        risk_score=results.get('risk_score', 0),
        status='completed'
    )
    db.session.add(scan)
    user.scans_today += 1
    user.total_scans += 1
    db.session.commit()
    
    return jsonify({
        'scan_id': scan.id,
        'results': results,
        'scans_remaining': max(0, current_app.config['SCAN_LIMITS'].get(user.tier, 5) - user.scans_today)
    })

@paid_bp.route('/ssl-audit', methods=['POST'])
@jwt_required()
def ssl_audit():
    identity = get_jwt_identity()
    user = User.query.get(identity['id'])
    
    if not check_scan_limit(user):
        return jsonify({'error': 'Scan limit reached'}), 402
    
    url = request.json.get('url', '')
    result = scanner.ssl_basic_check(url)
    
    # Save scan record
    scan = Scan(
        user_id=user.id,
        target=url,
        scan_type='ssl_audit',
        results=str(result),
        risk_score=0 if result.get('valid') else 50,
        status='completed'
    )
    db.session.add(scan)
    user.scans_today += 1
    user.total_scans += 1
    db.session.commit()
    
    return jsonify(result)