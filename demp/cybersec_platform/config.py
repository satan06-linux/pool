import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///cybersec.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-change-in-production'
    
    # Rate Limits (Dynamic from env)
    FREE_RATE_LIMIT = os.environ.get('FREE_RATE_LIMIT', '10 per hour;50 per day')
    PRO_RATE_LIMIT = os.environ.get('PRO_RATE_LIMIT', '100 per hour;1000 per day')
    
    # Scan Limits (Dynamic from env)
    SCAN_LIMITS = {
        'free': int(os.environ.get('FREE_SCAN_LIMIT', 5)),
        'pro': int(os.environ.get('PRO_SCAN_LIMIT', 100)),
        'business': int(os.environ.get('BUSINESS_SCAN_LIMIT', 1000)),
        'enterprise': float('inf')
    }
    
    # Razorpay (Dynamic from env)
    RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID')
    RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET')
    
    # Redis/Celery
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL