from flask import Blueprint, request, jsonify
from engines.security_scanner import SecurityScanner

free_bp = Blueprint('free_tools', __name__)
scanner = SecurityScanner()

@free_bp.route('/phishing-scan', methods=['POST'])
def phishing_scan():
    url = request.json.get('url', '').strip()
    if not url:
        return jsonify({'error': 'URL is required'}), 400
    
    result = scanner.phishing_detection(url)
    return jsonify(result)

@free_bp.route('/password-strength', methods=['POST'])
def password_strength():
    password = request.json.get('password', '')
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    
    result = scanner.password_analysis(password)
    return jsonify(result)

@free_bp.route('/hash-generator', methods=['POST'])
def hash_generator():
    text = request.json.get('text', '')
    algorithm = request.json.get('algorithm', 'sha256')
    
    result = scanner.generate_hash(text, algorithm)
    return jsonify(result)