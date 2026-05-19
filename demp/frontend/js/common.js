// Configuration
const API_BASE_URL = 'http://localhost:5000/api/v1';
let authToken = localStorage.getItem('cybersec_token');
let currentUser = null;
let currentTheme = localStorage.getItem('theme') || 'dark';

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
    applyTheme();
    checkAuthStatus();
});

// Theme Functions
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applyTheme();
}

function applyTheme() {
    const body = document.body;
    const themeIcons = document.querySelectorAll('[id^="themeIcon"]');
    
    if (currentTheme === 'light') {
        body.classList.add('light-mode');
        themeIcons.forEach(icon => {
            if (icon) icon.className = 'fas fa-moon';
        });
    } else {
        body.classList.remove('light-mode');
        themeIcons.forEach(icon => {
            if (icon) icon.className = 'fas fa-sun';
        });
    }
}

// Authentication Functions
async function checkAuthStatus() {
    if (authToken) {
        try {
            const response = await apiCall('/auth/profile', {}, 'GET');
            if (response.error) {
                logout();
            } else {
                currentUser = response;
                updateUIForLoggedInUser();
            }
        } catch (error) {
            logout();
        }
    }
}

function updateUIForLoggedInUser() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const dashboardLink = document.getElementById('dashboardLink');
    const adminLink = document.getElementById('adminLink');
    const userName = document.getElementById('userName');
    const quickAuth = document.getElementById('quickAuth');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (dashboardLink) dashboardLink.style.display = 'block';
    if (quickAuth) quickAuth.style.display = 'none';
    
    if (userName) {
        userName.textContent = currentUser.full_name || currentUser.email;
    }
    
    // Show admin link if user is admin
    if (adminLink && currentUser.is_admin) {
        adminLink.style.display = 'block';
    }
    
    // Show welcome message for new users (check if they just registered)
    const isNewUser = localStorage.getItem('new_user_welcome');
    if (isNewUser && welcomeMessage) {
        welcomeMessage.style.display = 'block';
        localStorage.removeItem('new_user_welcome'); // Remove flag after showing
        
        // Auto-hide welcome message after 10 seconds
        setTimeout(() => {
            if (welcomeMessage) {
                welcomeMessage.style.display = 'none';
            }
        }, 10000);
    }
    
    // Update pro tool access
    const proTools = document.querySelectorAll('.pro-tool');
    if (currentUser.tier === 'pro' || currentUser.tier === 'business' || currentUser.tier === 'enterprise') {
        proTools.forEach(tool => {
            tool.classList.remove('disabled');
        });
    } else {
        proTools.forEach(tool => {
            tool.classList.add('disabled');
        });
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('cybersec_token');
    
    // Redirect to main page
    window.location.href = 'main.html';
}

// API Functions
async function apiCall(endpoint, data = {}, method = 'POST') {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (method !== 'GET') {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
        throw { status: response.status, ...result };
    }

    return result;
}

// Utility Functions
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('show');
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('show');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                          type === 'error' ? 'exclamation-circle' : 
                          'info-circle'}"></i>
        <span>${message}</span>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// User Menu Toggle
function toggleUserMenu() {
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (dropdownMenu) {
        dropdownMenu.classList.toggle('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (userMenu && dropdownMenu && !userMenu.contains(event.target)) {
        dropdownMenu.classList.remove('show');
    }
});

// Navigation Functions for startup/welcome screens
function goToLogin() {
    window.location.href = 'login.html';
}

function goToRegister() {
    window.location.href = 'register.html';
}

function goToMain() {
    window.location.href = 'main.html';
}

// Add notification styles dynamically
const notificationStyles = `
    .notification {
        position: fixed;
        top: 90px;
        right: 20px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        padding: 15px 20px;
        color: white;
        display: flex;
        align-items: center;
        gap: 10px;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 4000;
        min-width: 300px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification-success {
        border-left: 4px solid #22c55e;
    }

    .notification-error {
        border-left: 4px solid #ef4444;
    }

    .notification-info {
        border-left: 4px solid #00d4ff;
    }

    .notification i {
        font-size: 1.2rem;
    }

    .notification-success i {
        color: #22c55e;
    }

    .notification-error i {
        color: #ef4444;
    }

    .notification-info i {
        color: #00d4ff;
    }

    body.light-mode .notification {
        background: rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(0, 0, 0, 0.2);
        color: #1e293b;
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);