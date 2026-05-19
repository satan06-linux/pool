from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
from datetime import datetime, timedelta
import uuid
import hashlib
import re
from urllib.parse import urlparse

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///cybersec.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.permanent_session_lifetime = timedelta(hours=24)

db = SQLAlchemy(app)

# Admin Credentials (HARDCODED FOR TESTING - CHANGE IN PRODUCTION)
ADMIN_CREDENTIALS = {
    'admin@cybersec.com': generate_password_hash('admin123'),
    'superadmin@cybersec.com': generate_password_hash('SuperSecure2025!')
}

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    subscription_tier = db.Column(db.String(20), default='free')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Tool Usage Model
class ToolUsage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    tool_name = db.Column(db.String(50))
    used_at = db.Column(db.DateTime, default=datetime.utcnow)

# Login decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in first', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Admin decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in first', 'warning')
            return redirect(url_for('login'))
        user = User.query.get(session['user_id'])
        if not user or not user.is_admin:
            flash('Admin access required', 'error')
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        # Check admin credentials first
        if email in ADMIN_CREDENTIALS:
            if check_password_hash(ADMIN_CREDENTIALS[email], password):
                session['user_id'] = f"admin_{email}"
                session['email'] = email
                session['is_admin'] = True
                flash('Admin login successful!', 'success')
                return redirect(url_for('admin_dashboard'))
        
        # Check database users
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.id
            session['email'] = user.email
            session['is_admin'] = user.is_admin
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        
        flash('Invalid email or password!', 'error')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered!', 'error')
            return render_template('register.html')
        
        user = User(
            email=email,
            password_hash=generate_password_hash(password),
            is_admin=False,
            subscription_tier='free'
        )
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    is_admin = session.get('is_admin', False)
    return render_template('dashboard.html', is_admin=is_admin)

@app.route('/admin')
@admin_required
def admin_dashboard():
    users = User.query.all()
    usages = ToolUsage.query.order_by(ToolUsage.used_at.desc()).limit(50).all()
    return render_template('admin_dashboard.html', users=users, usages=usages)

# TEMPORARILY DISABLED RAZORPAY - Free access for testing
@app.route('/subscribe')
@login_required
def subscribe():
    flash('Subscriptions temporarily disabled for testing. All features available!', 'info')
    user = User.query.get(session['user_id'])
    if user:
        user.subscription_tier = 'pro'  # Give PRO access for testing
        db.session.commit()
        flash('PRO access granted for testing!', 'success')
    return redirect(url_for('dashboard'))

# Security Tools (Free access for testing)
@app.route('/tools/phishing-check', methods=['POST'])
@login_required
def phishing_check():
    url = request.json.get('url', '')
    
    # Log usage
    usage = ToolUsage(user_id=session['user_id'], tool_name='phishing_check')
    db.session.add(usage)
    db.session.commit()
    
    # Basic phishing detection
    suspicious = False
    reasons = []
    
    # Common phishing indicators
    phishing_indicators = [
        'login', 'sign-in', 'bank', 'paypal', 'amazon', 'microsoft', 'google',
        'verify', 'account', 'security', 'update', 'password'
    ]
    
    parsed = urlparse(url.lower())
    domain = parsed.netloc
    
    for indicator in phishing_indicators:
        if indicator in domain or indicator in parsed.path:
            suspicious = True
            reasons.append(f"Suspicious keyword: {indicator}")
    
    if len(domain) > 50:
        suspicious = True
        reasons.append("Unusually long domain")
    
    if not parsed.scheme:
        suspicious = True
        reasons.append("Missing protocol (http/https)")
    
    result = {
        "safe": not suspicious,
        "risk_level": "HIGH" if suspicious else "LOW",
        "reasons": reasons,
        "score": 85 if not suspicious else 25
    }
    
    return jsonify(result)

@app.route('/tools/password-strength', methods=['POST'])
@login_required
def password_strength():
    password = request.json.get('password', '')
    
    usage = ToolUsage(user_id=session['user_id'], tool_name='password_strength')
    db.session.add(usage)
    db.session.commit()
    
    score = 0
    feedback = []
    
    if len(password) >= 12:
        score += 30
        feedback.append("✅ Length: Good")
    elif len(password) >= 8:
        score += 20
        feedback.append("⚠️ Length: Acceptable")
    else:
        feedback.append("❌ Length: Too short")
    
    if re.search(r'[A-Z]', password):
        score += 20
        feedback.append("✅ Uppercase: Good")
    else:
        feedback.append("❌ Uppercase: Missing")
    
    if re.search(r'[a-z]', password):
        score += 20
        feedback.append("✅ Lowercase: Good")
    else:
        feedback.append("❌ Lowercase: Missing")
    
    if re.search(r'\d', password):
        score += 15
        feedback.append("✅ Numbers: Good")
    else:
        feedback.append("❌ Numbers: Missing")
    
    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        score += 15
        feedback.append("✅ Symbols: Good")
    else:
        feedback.append("❌ Symbols: Missing")
    
    strength = "Very Weak" if score < 30 else "Weak" if score < 50 else "Good" if score < 70 else "Strong" if score < 85 else "Very Strong"
    
    return jsonify({
        "strength": strength,
        "score": score,
        "feedback": feedback,
        "color": "bg-red-500" if score < 50 else "bg-yellow-500" if score < 70 else "bg-green-500"
    })

# Create admin and init DB
@app.before_first_request
def create_tables():
    db.create_all()
    
    # Create test admin if doesn't exist
    for email, password_hash in ADMIN_CREDENTIALS.items():
        if not User.query.filter_by(email=email).first():
            admin = User(
                email=email,
                password_hash=password_hash,
                is_admin=True,
                subscription_tier='pro'
            )
            db.session.add(admin)
    db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Ensure admin exists
        for email, password_hash in ADMIN_CREDENTIALS.items():
            if not User.query.filter_by(email=email).first():
                admin = User(
                    email=email,
                    password_hash=password_hash,
                    is_admin=True,
                    subscription_tier='pro'
                )
                db.session.add(admin)
        db.session.commit()
    app.run(debug=True, port=int(os.getenv('PORT', 5000)))