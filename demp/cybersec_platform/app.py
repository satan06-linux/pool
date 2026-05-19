from flask import Flask, jsonify, render_template_string
from config import Config
from models import db, User
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from blueprints.auth import auth_bp
from blueprints.free_tools import free_bp
from blueprints.paid_tools import paid_bp
from blueprints.dashboard import dash_bp
from blueprints.billing import billing_bp
from blueprints.admin import admin_bp
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Extensions
    db.init_app(app)
    JWTManager(app)
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"]
    )
    
    # Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/v1')
    app.register_blueprint(free_bp, url_prefix='/api/v1/free')
    app.register_blueprint(paid_bp, url_prefix='/api/v1/pro')
    app.register_blueprint(dash_bp, url_prefix='/api/v1')
    app.register_blueprint(billing_bp, url_prefix='/api/v1')
    app.register_blueprint(admin_bp, url_prefix='/api/v1/admin')
    
    # Database initialization
    with app.app_context():
        db.create_all()
        create_admin_user()
    
    # Health check
    @app.route('/health')
    def health():
        return jsonify({
            'status': 'healthy',
            'version': '2.0.0',
            'lxml_version': '6.0.2',  # Your version
            'crypto_version': '39.0.2'  # Your version
        })
    
    # Landing page
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>CyberSec Platform</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gradient-to-br from-slate-900 to-gray-900 min-h-screen text-white">
            <div class="container mx-auto px-6 py-12">
                <div class="text-center mb-16">
                    <h1 class="text-6xl font-black mb-6 bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                        🚀 CyberSec Platform
                    </h1>
                    <p class="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                        Advanced cybersecurity scanning suite with FREE tools + premium features
                    </p>
                </div>
                
                <div class="text-center">
                    <a href="/frontend/index.html" class="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 text-lg font-bold rounded-lg inline-block">
                        🚀 Launch Platform
                    </a>
                    <p class="mt-4 text-gray-400">Admin Login: admin@cybersec.com / admin123</p>
                </div>
            </div>
        </body>
        </html>
        '''
    
    return app

def create_admin_user():
    """Create default admin user if it doesn't exist"""
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@cybersec.com')
    admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
    
    # Check if admin already exists
    admin = User.query.filter_by(email=admin_email).first()
    if not admin:
        admin = User(
            email=admin_email,
            full_name='System Administrator',
            tier='enterprise',
            is_admin=True
        )
        admin.set_password(admin_password)
        db.session.add(admin)
        db.session.commit()
        print(f"Admin user created: {admin_email} / {admin_password}")
    else:
        print(f"Admin user already exists: {admin_email}")
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))