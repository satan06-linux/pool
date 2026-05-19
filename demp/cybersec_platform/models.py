from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import json

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100))
    tier = db.Column(db.String(20), default='free')
    scans_today = db.Column(db.Integer, default=0)
    total_scans = db.Column(db.Integer, default=0)
    is_admin = db.Column(db.Boolean, default=False)
    company = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def can_scan(self):
        limits = current_app.config['SCAN_LIMITS']
        return self.scans_today < limits.get(self.tier, 5)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'tier': self.tier,
            'scans_today': self.scans_today,
            'total_scans': self.total_scans,
            'is_admin': self.is_admin,
            'is_pro': self.tier != 'free',
            'can_scan': self.can_scan(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Scan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    target = db.Column(db.String(500), nullable=False)
    scan_type = db.Column(db.String(50), nullable=False)
    results = db.Column(db.Text)  # JSON
    risk_score = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='completed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('scans', lazy=True))
    
    def get_results(self):
        return json.loads(self.results) if self.results else {}
    
    def to_dict(self):
        return {
            'id': self.id,
            'target': self.target,
            'scan_type': self.scan_type,
            'risk_score': float(self.risk_score),
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }

class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    razorpay_payment_id = db.Column(db.String(100), unique=True)
    tier = db.Column(db.String(20))
    status = db.Column(db.String(20), default='active')
    starts_at = db.Column(db.DateTime, default=datetime.utcnow)
    ends_at = db.Column(db.DateTime)
    amount = db.Column(db.Integer)  # In paise
    
    user = db.relationship('User', backref=db.backref('subscriptions', lazy=True))