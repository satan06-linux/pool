# CyberSec Platform

A comprehensive cybersecurity platform with advanced security scanning tools, user management, and admin dashboard.

## 🚀 Features

### Frontend (Multi-Page Architecture)
- **Startup Animation**: Professional loading sequence with package installation simulation
- **Welcome Screen**: User-friendly onboarding with theme toggle
- **Authentication**: Login, Register, Forgot Password with validation
- **Main Platform**: Security tools with free and premium features
- **Dashboard**: User analytics and scan history
- **Admin Panel**: Comprehensive admin dashboard with analytics
- **Dark/Light Mode**: Complete theme switching capability
- **Responsive Design**: Mobile-friendly across all pages

### Backend (Flask API)
- **Security Scanner Engine**: Phishing detection, password analysis, SSL auditing
- **User Management**: JWT authentication, role-based access
- **Subscription System**: Razorpay integration for payments
- **Admin Features**: User management, analytics, system monitoring
- **Database**: SQLite with SQLAlchemy ORM
- **Rate Limiting**: Flask-Limiter for API protection

### Security Tools
#### Free Tools
- 🎣 **Phishing Scanner**: Detect malicious URLs and phishing attempts
- 🔐 **Password Strength Checker**: Analyze password security with recommendations
- #️⃣ **Hash Generator**: Generate MD5, SHA-1, SHA-256, SHA-512 hashes

#### Pro Tools (Requires Subscription)
- 🛡️ **Full Security Scan**: Comprehensive vulnerability assessment
- 📜 **SSL/TLS Audit**: Certificate and configuration analysis
- 🔍 **Advanced Monitoring**: Real-time threat detection

## 📁 Project Structure

```
cybersec_platform/
├── frontend/                 # Multi-page frontend
│   ├── css/                 # Organized stylesheets
│   │   ├── common.css       # Shared styles and theme system
│   │   ├── startup.css      # Startup animation styles
│   │   ├── auth.css         # Authentication pages
│   │   ├── main.css         # Main platform styles
│   │   └── admin.css        # Admin dashboard styles
│   ├── js/                  # JavaScript modules
│   │   ├── common.js        # Shared utilities and API calls
│   │   ├── startup.js       # Startup sequence logic
│   │   ├── auth.js          # Authentication handling
│   │   ├── main.js          # Main platform functionality
│   │   ├── dashboard.js     # User dashboard
│   │   └── admin.js         # Admin panel with charts
│   ├── index.html           # Startup page
│   ├── login.html           # Login page
│   ├── register.html        # Registration page
│   ├── forgot-password.html # Password reset
│   ├── main.html            # Main platform
│   ├── dashboard.html       # User dashboard
│   └── admin.html           # Admin panel
├── cybersec_platform/       # Backend Flask application
│   ├── blueprints/          # API endpoints
│   │   ├── auth.py          # Authentication routes
│   │   ├── free_tools.py    # Free security tools
│   │   ├── paid_tools.py    # Premium features
│   │   ├── dashboard.py     # User dashboard API
│   │   ├── billing.py       # Payment processing
│   │   └── admin.py         # Admin management API
│   ├── engines/             # Security scanning engines
│   │   ├── security_scanner.py  # Core scanning logic
│   │   ├── ai_assistant.py      # AI-powered analysis
│   │   ├── monitoring.py        # Usage tracking
│   │   └── compliance.py        # GDPR compliance checker
│   ├── utils/               # Utility functions
│   │   ├── security.py      # Security helpers
│   │   ├── reports.py       # Report generation
│   │   └── limits.py        # Rate limiting logic
│   ├── models.py            # Database models
│   ├── config.py            # Configuration management
│   └── app.py               # Flask application factory
└── requirements.txt         # Python dependencies
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- pip package manager

### Backend Setup

1. **Clone and navigate to the project**
```bash
cd cybersec_platform
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize Database**
```bash
python app.py
```
This will create the SQLite database and default admin user.

### Frontend Setup

1. **Serve the frontend** (choose one method):

**Option A: Python HTTP Server**
```bash
cd frontend
python -m http.server 8080
```

**Option B: Node.js HTTP Server**
```bash
cd frontend
npx http-server -p 8080
```

**Option C: Any web server** pointing to the `frontend/` directory

2. **Access the application**
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000

## 🔐 Default Credentials

### Admin Access
- **Email**: admin@cybersec.com
- **Password**: admin123

### Test User (Auto-created)
- Register any new account for regular user access

## 🎯 Usage Guide

### For Regular Users
1. **Start**: Visit http://localhost:8080
2. **Watch**: Enjoy the startup animation
3. **Choose**: Sign in, create account, or continue as guest
4. **Scan**: Use free tools or upgrade for premium features
5. **Monitor**: View your security dashboard

### For Administrators
1. **Login**: Use admin credentials
2. **Access**: Navigate to Admin Panel
3. **Manage**: Users, subscriptions, and system settings
4. **Monitor**: Platform analytics and user activity
5. **Control**: System maintenance and configuration

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Security
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret

# Database
DATABASE_URL=sqlite:///cybersec.db

# Rate Limits
FREE_RATE_LIMIT=10 per hour;50 per day
PRO_RATE_LIMIT=100 per hour;1000 per day

# Scan Limits
FREE_SCAN_LIMIT=5
PRO_SCAN_LIMIT=100
BUSINESS_SCAN_LIMIT=1000

# Razorpay (for payments)
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Admin Credentials
ADMIN_EMAIL=admin@cybersec.com
ADMIN_PASSWORD=admin123
```

## 🎨 Theme System

The platform includes a complete dark/light mode system:
- **Toggle**: Available on all pages
- **Persistence**: Theme choice saved in localStorage
- **Responsive**: Adapts to user preferences
- **Comprehensive**: Covers all UI components

## 📊 Admin Features

### Dashboard Analytics
- User growth charts
- Scan activity monitoring
- Revenue tracking
- Risk distribution analysis

### User Management
- View all users with filtering
- Change user tiers
- Toggle admin privileges
- Export user data

### System Monitoring
- Recent activity feed
- Subscription management
- System maintenance tools
- Performance metrics

## 🔒 Security Features

### Authentication
- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Session management

### API Security
- Rate limiting per user tier
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Scanning Security
- URL validation
- Safe SSL certificate checking
- Sandboxed analysis environment
- Result sanitization

## 🚀 Deployment

### Production Considerations
1. **Environment**: Set production environment variables
2. **Database**: Consider PostgreSQL for production
3. **Web Server**: Use Gunicorn + Nginx
4. **SSL**: Enable HTTPS with proper certificates
5. **Monitoring**: Set up logging and monitoring
6. **Backup**: Regular database backups

### Docker Deployment (Optional)
```dockerfile
# Dockerfile example for backend
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔄 Updates

The platform is designed for easy updates and maintenance:
- Modular architecture
- Separated concerns
- Comprehensive logging
- Database migrations support

---

**Built with ❤️ for cybersecurity professionals**