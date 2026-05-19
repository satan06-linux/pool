from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Scan, Subscription, db
from datetime import datetime, timedelta
from sqlalchemy import func

admin_bp = Blueprint('admin', __name__)

def require_admin():
    """Decorator to check admin access"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            identity = get_jwt_identity()
            admin = User.query.get(identity['id'])
            
            if not admin or not admin.is_admin:
                return jsonify({'error': 'Admin access required'}), 403
            
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@require_admin()
def list_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    tier_filter = request.args.get('tier', '')
    
    query = User.query
    
    if search:
        query = query.filter(
            (User.email.contains(search)) | 
            (User.full_name.contains(search))
        )
    
    if tier_filter:
        query = query.filter(User.tier == tier_filter)
    
    users = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'users': [u.to_dict() for u in users.items],
        'total': users.total,
        'pages': users.pages,
        'current_page': page
    })

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
@require_admin()
def admin_stats():
    # Basic stats
    total_users = User.query.count()
    pro_users = User.query.filter(User.tier != 'free').count()
    total_scans = Scan.query.count()
    active_subscriptions = Subscription.query.filter(Subscription.status == 'active').count()
    
    # Growth stats (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_users_30d = User.query.filter(User.created_at >= thirty_days_ago).count()
    new_scans_30d = Scan.query.filter(Scan.created_at >= thirty_days_ago).count()
    
    # Revenue calculation
    revenue = db.session.query(func.sum(Subscription.amount)).filter(
        Subscription.status == 'active'
    ).scalar() or 0
    
    # Risk distribution
    high_risk_scans = Scan.query.filter(Scan.risk_score > 75).count()
    medium_risk_scans = Scan.query.filter(
        Scan.risk_score.between(40, 75)
    ).count()
    low_risk_scans = Scan.query.filter(Scan.risk_score < 40).count()
    
    return jsonify({
        'total_users': total_users,
        'pro_users': pro_users,
        'total_scans': total_scans,
        'active_subscriptions': active_subscriptions,
        'revenue': revenue / 100,  # Convert from paise to rupees
        'growth': {
            'new_users_30d': new_users_30d,
            'new_scans_30d': new_scans_30d,
            'user_growth_rate': (new_users_30d / max(total_users - new_users_30d, 1)) * 100
        },
        'risk_distribution': {
            'high': high_risk_scans,
            'medium': medium_risk_scans,
            'low': low_risk_scans
        }
    })

@admin_bp.route('/scans', methods=['GET'])
@jwt_required()
@require_admin()
def list_scans():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    scan_type = request.args.get('type', '')
    risk_level = request.args.get('risk', '')
    
    query = Scan.query.join(User)
    
    if scan_type:
        query = query.filter(Scan.scan_type == scan_type)
    
    if risk_level:
        if risk_level == 'high':
            query = query.filter(Scan.risk_score > 75)
        elif risk_level == 'medium':
            query = query.filter(Scan.risk_score.between(40, 75))
        elif risk_level == 'low':
            query = query.filter(Scan.risk_score < 40)
    
    scans = query.order_by(Scan.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    scan_data = []
    for scan in scans.items:
        scan_dict = scan.to_dict()
        scan_dict['user_email'] = scan.user.email
        scan_data.append(scan_dict)
    
    return jsonify({
        'scans': scan_data,
        'total': scans.total,
        'pages': scans.pages,
        'current_page': page
    })

@admin_bp.route('/subscriptions', methods=['GET'])
@jwt_required()
@require_admin()
def list_subscriptions():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    subscriptions = Subscription.query.join(User).order_by(
        Subscription.starts_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)
    
    sub_data = []
    for sub in subscriptions.items:
        sub_dict = {
            'id': sub.id,
            'user_email': sub.user.email,
            'user_name': sub.user.full_name,
            'tier': sub.tier,
            'status': sub.status,
            'amount': sub.amount / 100,  # Convert to rupees
            'starts_at': sub.starts_at.isoformat() if sub.starts_at else None,
            'ends_at': sub.ends_at.isoformat() if sub.ends_at else None,
            'razorpay_payment_id': sub.razorpay_payment_id
        }
        sub_data.append(sub_dict)
    
    return jsonify({
        'subscriptions': sub_data,
        'total': subscriptions.total,
        'pages': subscriptions.pages,
        'current_page': page
    })

@admin_bp.route('/analytics/charts', methods=['GET'])
@jwt_required()
@require_admin()
def analytics_charts():
    # User growth over last 12 months
    months = []
    user_counts = []
    scan_counts = []
    
    for i in range(12):
        month_start = datetime.utcnow().replace(day=1) - timedelta(days=30*i)
        month_end = month_start + timedelta(days=30)
        
        users_in_month = User.query.filter(
            User.created_at.between(month_start, month_end)
        ).count()
        
        scans_in_month = Scan.query.filter(
            Scan.created_at.between(month_start, month_end)
        ).count()
        
        months.append(month_start.strftime('%b %Y'))
        user_counts.append(users_in_month)
        scan_counts.append(scans_in_month)
    
    # Reverse to show chronological order
    months.reverse()
    user_counts.reverse()
    scan_counts.reverse()
    
    # Scan type distribution
    scan_types = db.session.query(
        Scan.scan_type, func.count(Scan.id)
    ).group_by(Scan.scan_type).all()
    
    # User tier distribution
    user_tiers = db.session.query(
        User.tier, func.count(User.id)
    ).group_by(User.tier).all()
    
    return jsonify({
        'user_growth': {
            'labels': months,
            'data': user_counts
        },
        'scan_activity': {
            'labels': months,
            'data': scan_counts
        },
        'scan_types': {
            'labels': [st[0] for st in scan_types],
            'data': [st[1] for st in scan_types]
        },
        'user_distribution': {
            'labels': [ut[0] for ut in user_tiers],
            'data': [ut[1] for ut in user_tiers]
        }
    })

@admin_bp.route('/users/<int:user_id>/toggle-admin', methods=['POST'])
@jwt_required()
@require_admin()
def toggle_admin(user_id):
    user = User.query.get_or_404(user_id)
    user.is_admin = not user.is_admin
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Admin status {"granted" if user.is_admin else "revoked"} for {user.email}'
    })

@admin_bp.route('/users/<int:user_id>/change-tier', methods=['POST'])
@jwt_required()
@require_admin()
def change_user_tier(user_id):
    user = User.query.get_or_404(user_id)
    new_tier = request.json.get('tier')
    
    if new_tier not in ['free', 'pro', 'business', 'enterprise']:
        return jsonify({'error': 'Invalid tier'}), 400
    
    user.tier = new_tier
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'User {user.email} tier changed to {new_tier}'
    })

@admin_bp.route('/system/maintenance', methods=['POST'])
@jwt_required()
@require_admin()
def system_maintenance():
    action = request.json.get('action')
    
    if action == 'reset_daily_scans':
        # Reset all users' daily scan counts
        User.query.update({'scans_today': 0})
        db.session.commit()
        return jsonify({'success': True, 'message': 'Daily scan counts reset'})
    
    elif action == 'cleanup_old_scans':
        # Delete scans older than 90 days
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        old_scans = Scan.query.filter(Scan.created_at < ninety_days_ago).delete()
        db.session.commit()
        return jsonify({'success': True, 'message': f'Deleted {old_scans} old scans'})
    
    return jsonify({'error': 'Invalid action'}), 400

@admin_bp.route('/recent-activity', methods=['GET'])
@jwt_required()
@require_admin()
def recent_activity():
    # Get recent user registrations
    recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
    
    # Get recent scans
    recent_scans = Scan.query.join(User).order_by(Scan.created_at.desc()).limit(10).all()
    
    # Get recent subscriptions
    recent_subs = Subscription.query.join(User).order_by(Subscription.starts_at.desc()).limit(5).all()
    
    activity = []
    
    # Add user registrations
    for user in recent_users:
        activity.append({
            'type': 'user_registration',
            'message': f'New user registered: {user.email}',
            'timestamp': user.created_at.isoformat(),
            'icon': 'fa-user-plus',
            'color': 'blue'
        })
    
    # Add scans
    for scan in recent_scans:
        risk_color = 'red' if scan.risk_score > 75 else 'yellow' if scan.risk_score > 40 else 'green'
        activity.append({
            'type': 'scan',
            'message': f'{scan.user.email} scanned {scan.target}',
            'timestamp': scan.created_at.isoformat(),
            'icon': 'fa-search',
            'color': risk_color,
            'risk_score': scan.risk_score
        })
    
    # Add subscriptions
    for sub in recent_subs:
        activity.append({
            'type': 'subscription',
            'message': f'{sub.user.email} upgraded to {sub.tier}',
            'timestamp': sub.starts_at.isoformat() if sub.starts_at else datetime.utcnow().isoformat(),
            'icon': 'fa-crown',
            'color': 'gold'
        })
    
    # Sort by timestamp
    activity.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return jsonify({'activity': activity[:20]})  # Return latest 20 activities