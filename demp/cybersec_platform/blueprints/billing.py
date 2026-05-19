from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Subscription, User
from datetime import datetime
import razorpay

billing_bp = Blueprint('billing', __name__)

# Dynamic Razorpay client
def get_razorpay_client():
    return razorpay.Client(
        auth=(current_app.config['RAZORPAY_KEY_ID'], current_app.config['RAZORPAY_KEY_SECRET'])
    )

@billing_bp.route('/billing/create-order', methods=['POST'])
@jwt_required()
def create_order():
    identity = get_jwt_identity()
    user = User.query.get(identity['id'])
    
    data = request.json
    amount = int(data.get('amount', 99900))  # Default ₹999
    tier = data.get('tier', 'pro')
    
    client = get_razorpay_client()
    order = client.order.create({
        'amount': amount,
        'currency': 'INR',
        'receipt': f'cybersec_{user.id}_{int(datetime.now().timestamp())}'
    })
    
    return jsonify({
        'order_id': order['id'],
        'amount': order['amount'],
        'currency': order['currency'],
        'tier': tier
    })

@billing_bp.route('/billing/verify-payment', methods=['POST'])
@jwt_required()
def verify_payment():
    data = request.json
    signature = data.get('razorpay_signature')
    payment_id = data.get('razorpay_payment_id')
    order_id = data.get('razorpay_order_id')
    
    client = get_razorpay_client()
    result = client.utility.verify_payment_signature({
        'razorpay_order_id': order_id,
        'razorpay_payment_id': payment_id,
        'razorpay_signature': signature
    })
    
    if result:
        identity = get_jwt_identity()
        user = User.query.get(identity['id'])
        user.tier = data.get('tier', 'pro')
        db.session.commit()
        
        # Create subscription record
        sub = Subscription(
            user_id=user.id,
            razorpay_payment_id=payment_id,
            tier=user.tier,
            amount=int(data.get('amount', 0))
        )
        db.session.add(sub)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Payment verified! PRO unlocked.'})
    
    return jsonify({'error': 'Payment verification failed'}), 400