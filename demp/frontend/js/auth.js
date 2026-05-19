// Auth Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeAuthPage();
});

function initializeAuthPage() {
    // Check if user is already logged in
    if (authToken && currentUser) {
        // Redirect to main page if already logged in
        window.location.href = 'main.html';
        return;
    }

    // Setup form handlers
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        setupPasswordStrengthChecker();
    }

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
}

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember')?.checked || false;

    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    showLoading();
    
    try {
        const response = await apiCall('/auth/login', { email, password });
        
        if (response.token) {
            authToken = response.token;
            currentUser = response.user;
            
            // Store token
            localStorage.setItem('cybersec_token', authToken);
            
            // Store remember preference
            if (remember) {
                localStorage.setItem('remember_user', 'true');
            }

            showNotification('Login successful! Redirecting...', 'success');
            
            // Always redirect to main page after login
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 1000);
            
        } else {
            showNotification(response.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        if (error.status === 401) {
            showNotification('Invalid email or password', 'error');
        } else {
            showNotification('Login failed. Please try again.', 'error');
        }
    }
    
    hideLoading();
}

// Register Handler
async function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const company = document.getElementById('company')?.value.trim() || '';
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms')?.checked || false;

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (!terms) {
        showNotification('Please accept the terms and conditions', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    showLoading();
    
    try {
        const response = await apiCall('/auth/register', { 
            name: fullName, 
            email, 
            password,
            company 
        });
        
        if (response.token) {
            authToken = response.token;
            currentUser = response.user;
            
            localStorage.setItem('cybersec_token', authToken);
            
            // Set flag for new user welcome message
            localStorage.setItem('new_user_welcome', 'true');
            
            showNotification('Account created successfully! Redirecting to main page...', 'success');
            
            // Always redirect to main page after registration
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 1000);
            
        } else {
            showNotification(response.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        if (error.status === 409) {
            showNotification('Email already exists. Please use a different email.', 'error');
        } else {
            showNotification('Registration failed. Please try again.', 'error');
        }
    }
    
    hideLoading();
}

// Forgot Password Handler
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value.trim();

    if (!email) {
        showNotification('Please enter your email address', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    showLoading();
    
    try {
        // Simulate API call for forgot password
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showNotification('Password reset link sent to your email!', 'success');
        
        // Clear form and redirect to login
        document.getElementById('forgotEmail').value = '';
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        showNotification('Failed to send reset link. Please try again.', 'error');
    }
    
    hideLoading();
}

// Password Strength Checker
function setupPasswordStrengthChecker() {
    const passwordInput = document.getElementById('password');
    const strengthIndicator = document.getElementById('passwordStrength');
    
    if (!passwordInput || !strengthIndicator) return;

    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        
        strengthIndicator.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill strength-${strength.level}" style="width: ${strength.score}%"></div>
            </div>
            <span class="strength-text strength-${strength.level}">${strength.text}</span>
        `;
    });
}

function calculatePasswordStrength(password) {
    let score = 0;
    let level = 'weak';
    let text = 'Weak';

    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;

    if (score >= 80) {
        level = 'strong';
        text = 'Strong';
    } else if (score >= 60) {
        level = 'medium';
        text = 'Medium';
    }

    return { score, level, text };
}

// Utility Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Add password strength styles
const strengthStyles = `
    .password-strength {
        margin-top: 8px;
    }

    .strength-bar {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 5px;
    }

    .strength-fill {
        height: 100%;
        transition: width 0.3s ease, background-color 0.3s ease;
        border-radius: 2px;
    }

    .strength-fill.strength-weak {
        background: #ef4444;
    }

    .strength-fill.strength-medium {
        background: #f59e0b;
    }

    .strength-fill.strength-strong {
        background: #10b981;
    }

    .strength-text {
        font-size: 0.8rem;
        font-weight: 500;
    }

    .strength-text.strength-weak {
        color: #ef4444;
    }

    .strength-text.strength-medium {
        color: #f59e0b;
    }

    .strength-text.strength-strong {
        color: #10b981;
    }

    body.light-mode .strength-bar {
        background: rgba(0, 0, 0, 0.1);
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = strengthStyles;
document.head.appendChild(styleSheet);