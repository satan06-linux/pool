from flask import current_app
from models import User

def check_scan_limit(user):
    """Check if user can perform scan"""
    limits = current_app.config['SCAN_LIMITS']
    return user.scans_today < limits.get(user.tier, 5)

def reset_daily_limits():
    """Reset daily scan counters (cron job)"""
    from ..models import User
    yesterday = datetime.now() - timedelta(days=1)
    User.query.filter(User.updated_at < yesterday).update({
        User.scans_today: 0,
        User.updated_at: datetime.utcnow()
    })