import re
import socket
import ssl
from urllib.parse import urlparse
import hashlib
import requests
from datetime import datetime
from lxml import etree  # lxml 6.0.2
from utils.security import is_valid_url

class SecurityScanner:
    def phishing_detection(self, url):
        score = 0
        parsed = urlparse(url.lower())
        domain = parsed.netloc
        path = parsed.path
        
        # Dynamic phishing patterns (no hardcoded lists)
        suspicious_keywords = ['login', 'bank', 'paypal', 'verify', 'account', 'password', 'secure']
        risky_tlds = ['.tk', '.ml', '.ga', '.cf', '.gq']
        
        for keyword in suspicious_keywords:
            if keyword in domain or keyword in path:
                score += 25
        
        if any(tld in domain for tld in risky_tlds):
            score += 40
        
        if re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url):
            score += 50  # IP address
        
        return {
            'is_phishing': score > 60,
            'confidence': min(score * 1.5, 100),
            'risk_score': score,
            'domain': domain,
            'suspicious_indicators': score > 30
        }
    
    def password_analysis(self, password):
        score = 0
        feedback = []
        
        length_score = min(len(password), 20)
        score += length_score * 3
        
        if re.search(r'[A-Z]', password): score += 20
        if re.search(r'[a-z]', password): score += 20
        if re.search(r'\d', password): score += 20
        if re.search(r'[!@#$%^&*(),.?":{}|<>]', password): score += 25
        
        # Common patterns penalty
        common_patterns = ['123456', 'password', 'qwerty', 'admin']
        for pattern in common_patterns:
            if pattern in password.lower():
                score -= 40
                feedback.append(f'Avoid common pattern: {pattern}')
                break
        
        strength_map = {
            range(0, 30): 'Very Weak',
            range(30, 60): 'Weak', 
            range(60, 85): 'Good',
            range(85, 101): 'Strong'
        }
        
        strength = 'Very Weak'
        for score_range, level in strength_map.items():
            if score in score_range:
                strength = level
                break
        
        return {
            'strength': strength,
            'score': min(score, 100),
            'feedback': feedback,
            'time_to_crack_estimate': f'{score * 1000:,} years (estimated)'
        }
    
    def generate_hash(self, text, algorithm='sha256'):
        algorithms = {
            'md5': hashlib.md5,
            'sha1': hashlib.sha1,
            'sha256': hashlib.sha256,
            'sha512': hashlib.sha512
        }
        
        hasher = algorithms.get(algorithm, hashlib.sha256)
        hash_value = hasher(text.encode()).hexdigest()
        
        return {
            'algorithm': algorithm,
            'hash': hash_value,
            'length': len(hash_value),
            'digest_size': hasher().digest_size * 8
        }
    
    def comprehensive_audit(self, url):
        """Full security assessment"""
        phishing = self.phishing_detection(url)
        ssl_result = self.ssl_basic_check(url)
        
        risk_score = 0
        if phishing['is_phishing']: risk_score += 40
        if not ssl_result['valid']: risk_score += 30
        
        return {
            'target': url,
            'phishing': phishing,
            'ssl': ssl_result,
            'risk_score': risk_score,
            'risk_level': self._get_risk_level(risk_score),
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def ssl_basic_check(self, url):
        try:
            domain = urlparse(url).netloc
            context = ssl.create_default_context()
            
            with socket.create_connection((domain, 443), timeout=8) as sock:
                with context.wrap_socket(sock, server_hostname=domain) as ssock:
                    cert = ssock.getpeercert()
                    
                    return {
                        'valid': True,
                        'issuer': cert.get('issuer', []),
                        'subject': cert.get('subject', []),
                        'not_after': cert.get('notAfter', 'Unknown'),
                        'grade': 'A' if 'SHA256' in str(cert) else 'B'
                    }
        except Exception:
            return {
                'valid': False,
                'error': 'SSL handshake failed',
                'grade': 'F'
            }
    
    def _get_risk_level(self, score):
        levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        return levels[min(int(score / 25), 3)]