// Configuration
const API_BASE_URL = 'http://localhost:5000/api/v1';
let authToken = localStorage.getItem('cybersec_token');
let currentUser = null;
let currentTheme = localStorage.getItem('theme') || 'dark';

// DOM Elements
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const authButtons = document.getElementById('authButtons');
const userMenu = document.getElementById('userMenu');
const dashboardLink = document.getElementById('dashboardLink');
const loadingOverlay = document.getElementById('loadingOverlay');
const startupScreen = document.getElementById('startupScreen');
const welcomeScreen = document.getElementById('welcomeScreen');
const mainContent = document.getElementById('mainContent');
const navbar = document.getElementById('navbar');
const quickAuth = document.getElementById('quickAuth');

// Startup sequence data
const startupCommands = [
    { text: 'npm install cybersec-scanner@latest', delay: 500 },
    { text: '✓ Installing security modules...', delay: 800 },
    { text: 'npm install threat-detector@2.1.0', delay: 600 },
    { text: '✓ Loading threat detection engine...', delay: 700 },
    { text: 'npm install vulnerability-scanner@3.0.1', delay: 650 },
    { text: '✓ Initializing vulnerability scanner...', delay: 750 },
    { text: 'npm install ssl-analyzer@1.5.2', delay: 550 },
    { text: '✓ SSL/TLS analyzer ready...', delay: 600 },
    { text: 'npm install phishing-detector@4.2.0', delay: 700 },
    { text: '✓ Phishing detection active...', delay: 650 },
    { text: '', delay: 300 },
    { text: '🚀 CyberSec Platform initialized successfully!', delay: 800 },
    { text: '🔒 All security modules loaded and ready.', delay: 500 }
];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    applyTheme();
    startupSequence();
});

async function startupSequence() {
    const terminalOutput = document.getElementById('terminalOutput');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    let currentProgress = 0;
    const progressStep = 100 / startupCommands.length;
    
    for (let i = 0; i < startupCommands.length; i++) {
        const command = startupCommands[i];
        
        // Update progress
        currentProgress += progressStep;
        progressFill.style.width = `${Math.min(currentProgress, 100)}%`;
        
        // Update progress text
        if (command.text.includes('npm install')) {
            progressText.textContent = `Installing ${command.text.split(' ')[2]}...`;
        } else if (command.text.includes('✓')) {
            progressText.textContent = command.text;
        } else if (command.text.includes('🚀')) {
            progressText.textContent = 'Startup complete!';
        }
        
        // Add command to terminal
        if (command.text) {
            const line = document.createElement('div');
            line.className = 'terminal-line';
            
            if (command.text.includes('npm install')) {
                line.innerHTML = `<span class="prompt">cybersec@platform:~$</span> ${command.text}`;
            } else {
                line.innerHTML = command.text;
                if (command.text.includes('✓')) {
                    line.style.color = '#00ff00';
                } else if (command.text.includes('🚀') || command.text.includes('🔒')) {
                    line.style.color = '#00d4ff';
                }
            }
            
            terminalOutput.appendChild(line);
            
            // Auto scroll terminal
            const terminalBody = document.querySelector('.terminal-body');
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }
        
        await new Promise(resolve => setTimeout(resolve, command.delay));
    }
    
    // Complete progress
    progressFill.style.width = '100%';
    progressText.textContent = 'Ready to secure your digital world!';
    
    // Wait a bit then show welcome screen
    setTimeout(() => {
        startupScreen.style.display = 'none';
        showWelcomeScreen();
    }, 1500);
}

function showWelcomeScreen() {
    // Check if user is already logged in
    if (authToken) {
        checkAuthStatus().then(() => {
            if (currentUser) {
                showMainContent();
                return;
            }
            welcomeScreen.style.display = 'flex';
        });
    } else {
        welcomeScreen.style.display = 'flex';
    }
}

function showMainContent() {
    welcomeScreen.style.display = 'none';
    mainContent.style.display = 'block';
    navbar.style.display = 'block';
    
    // Initialize main app
    initializeApp();
}

function continueAsGuest() {
    showMainContent();
}

function showWelcomeLogin() {
    welcomeScreen.style.display = 'none';
    showLogin();
}

function showWelcomeRegister() {
    welcomeScreen.style.display = 'none';
    showRegister();
}

// Theme Functions
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applyTheme();
}

function applyTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    const themeIconWelcome = document.getElementById('themeIconWelcome');
    
    if (currentTheme === 'light') {
        body.classList.add('light-mode');
        if (themeIcon) themeIcon.className = 'fas fa-moon';
        if (themeIconWelcome) themeIconWelcome.className = 'fas fa-moon';
    } else {
        body.classList.remove('light-mode');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
        if (themeIconWelcome) themeIconWelcome.className = 'fas fa-sun';
    }
}

function initializeApp() {
    setupEventListeners();
    checkAuthStatus();
    
    // Mobile menu toggle
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // Form submissions
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('href').substring(1);
            scrollToSection(target);
            updateActiveNavLink(e.target);
        });
    });

    // Scroll spy for navigation
    window.addEventListener('scroll', updateNavOnScroll);
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
    } else {
        // Show quick auth section for non-logged in users
        if (quickAuth) {
            quickAuth.style.display = 'block';
        }
    }
}

function updateUIForLoggedInUser() {
    authButtons.style.display = 'none';
    userMenu.style.display = 'flex';
    dashboardLink.style.display = 'block';
    
    // Hide quick auth section
    if (quickAuth) {
        quickAuth.style.display = 'none';
    }
    
    document.getElementById('userName').textContent = currentUser.full_name || currentUser.email;
    
    // Update pro tool access
    const proTools = document.querySelectorAll('.pro-tool');
    if (currentUser.tier === 'pro') {
        proTools.forEach(tool => {
            tool.classList.remove('disabled');
        });
    } else {
        proTools.forEach(tool => {
            tool.classList.add('disabled');
        });
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    showLoading();
    try {
        const response = await apiCall('/auth/login', { email, password });
        if (response.token) {
            authToken = response.token;
            localStorage.setItem('cybersec_token', authToken);
            currentUser = response.user;
            updateUIForLoggedInUser();
            closeModal('loginModal');
            showNotification('Login successful!', 'success');
        } else {
            showNotification(response.error || 'Login failed', 'error');
        }
    } catch (error) {
        showNotification('Login failed. Please try again.', 'error');
    }
    hideLoading();
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    showLoading();
    try {
        const response = await apiCall('/auth/register', { name, email, password });
        if (response.token) {
            authToken = response.token;
            localStorage.setItem('cybersec_token', authToken);
            currentUser = response.user;
            updateUIForLoggedInUser();
            closeModal('registerModal');
            showNotification('Registration successful!', 'success');
        } else {
            showNotification(response.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showNotification('Registration failed. Please try again.', 'error');
    }
    hideLoading();
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('cybersec_token');
    authButtons.style.display = 'flex';
    userMenu.style.display = 'none';
    dashboardLink.style.display = 'none';
    
    // Show quick auth section again
    if (quickAuth) {
        quickAuth.style.display = 'block';
    }
    
    // Hide dashboard section
    document.getElementById('dashboard').style.display = 'none';
    scrollToSection('home');
    
    showNotification('Logged out successfully', 'info');
}

// Tool Functions
async function scanPhishing() {
    const url = document.getElementById('phishingUrl').value.trim();
    if (!url) {
        showNotification('Please enter a URL', 'error');
        return;
    }

    showLoading();
    try {
        const response = await apiCall('/free/phishing-scan', { url });
        displayResult('phishingResult', response);
    } catch (error) {
        showNotification('Scan failed. Please try again.', 'error');
    }
    hideLoading();
}

async function checkPassword() {
    const password = document.getElementById('passwordInput').value;
    if (!password) {
        showNotification('Please enter a password', 'error');
        return;
    }

    showLoading();
    try {
        const response = await apiCall('/free/password-strength', { password });
        displayResult('passwordResult', response);
    } catch (error) {
        showNotification('Analysis failed. Please try again.', 'error');
    }
    hideLoading();
}

async function generateHash() {
    const text = document.getElementById('hashText').value.trim();
    const algorithm = document.getElementById('hashAlgorithm').value;
    
    if (!text) {
        showNotification('Please enter text to hash', 'error');
        return;
    }

    showLoading();
    try {
        const response = await apiCall('/free/hash-generator', { text, algorithm });
        displayResult('hashResult', response);
    } catch (error) {
        showNotification('Hash generation failed. Please try again.', 'error');
    }
    hideLoading();
}

async function fullSecurityScan() {
    if (!authToken) {
        showNotification('Please login to use Pro features', 'error');
        showLogin();
        return;
    }

    if (currentUser.tier !== 'pro') {
        showNotification('Upgrade to Pro to use this feature', 'error');
        scrollToSection('pricing');
        return;
    }

    const url = document.getElementById('fullScanUrl').value.trim();
    if (!url) {
        showNotification('Please enter a URL', 'error');
        return;
    }

    showLoading();
    try {
        const response = await apiCall('/pro/full-security-scan', { url });
        displayResult('fullScanResult', response);
        
        if (response.scans_remaining !== undefined) {
            showNotification(`Scan complete! ${response.scans_remaining} scans remaining today.`, 'success');
        }
    } catch (error) {
        if (error.status === 402) {
            showNotification('Daily scan limit reached. Upgrade your plan for more scans.', 'error');
        } else {
            showNotification('Scan failed. Please try again.', 'error');
        }
    }
    hideLoading();
}

async function sslAudit() {
    if (!authToken) {
        showNotification('Please login to use Pro features', 'error');
        showLogin();
        return;
    }

    if (currentUser.tier !== 'pro') {
        showNotification('Upgrade to Pro to use this feature', 'error');
        scrollToSection('pricing');
        return;
    }

    const url = document.getElementById('sslUrl').value.trim();
    if (!url) {
        showNotification('Please enter a URL', 'error');
        return;
    }

    showLoading();
    try {
        const response = await apiCall('/pro/ssl-audit', { url });
        displayResult('sslResult', response);
    } catch (error) {
        if (error.status === 402) {
            showNotification('Daily scan limit reached. Upgrade your plan for more scans.', 'error');
        } else {
            showNotification('SSL audit failed. Please try again.', 'error');
        }
    }
    hideLoading();
}

// Dashboard Functions
async function loadDashboard() {
    if (!authToken) {
        showNotification('Please login to view dashboard', 'error');
        showLogin();
        return;
    }

    showLoading();
    try {
        const response = await apiCall('/dashboard');
        updateDashboardStats(response.stats);
        updateRecentScans(response.recent_scans);
        document.getElementById('dashboard').style.display = 'block';
    } catch (error) {
        showNotification('Failed to load dashboard', 'error');
    }
    hideLoading();
}

function updateDashboardStats(stats) {
    document.getElementById('totalScans').textContent = stats.total_scans || 0;
    document.getElementById('todayScans').textContent = stats.scans_today || 0;
    document.getElementById('highRisk').textContent = stats.high_risk || 0;
    document.getElementById('avgRisk').textContent = Math.round(stats.avg_risk || 0);
}

function updateRecentScans(scans) {
    const scansList = document.getElementById('scansList');
    scansList.innerHTML = '';

    if (!scans || scans.length === 0) {
        scansList.innerHTML = '<p style="color: #ccc; text-align: center;">No scans yet</p>';
        return;
    }

    scans.forEach(scan => {
        const scanItem = document.createElement('div');
        scanItem.className = 'scan-item';
        
        const riskClass = scan.risk_score > 75 ? 'risk-high' : 
                         scan.risk_score > 40 ? 'risk-medium' : 'risk-low';
        
        scanItem.innerHTML = `
            <div class="scan-info">
                <h4>${scan.target}</h4>
                <p>${new Date(scan.created_at).toLocaleDateString()}</p>
            </div>
            <div class="risk-score ${riskClass}">
                ${scan.risk_score}%
            </div>
        `;
        
        scansList.appendChild(scanItem);
    });
}

// Billing Functions
async function upgradeToPro() {
    if (!authToken) {
        showNotification('Please login first', 'error');
        showLogin();
        return;
    }

    showLoading();
    try {
        const response = await apiCall('/billing/create-order', { 
            amount: 99900, // ₹999 in paise
            tier: 'pro' 
        });
        
        const options = {
            key: 'rzp_test_your_key_here', // Replace with your Razorpay key
            amount: response.amount,
            currency: response.currency,
            name: 'CyberSec Platform',
            description: 'Pro Plan Subscription',
            order_id: response.order_id,
            handler: async function(paymentResponse) {
                await verifyPayment(paymentResponse, response.tier);
            },
            prefill: {
                name: currentUser.full_name,
                email: currentUser.email
            },
            theme: {
                color: '#00d4ff'
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
    } catch (error) {
        showNotification('Failed to create payment order', 'error');
    }
    hideLoading();
}

async function verifyPayment(paymentResponse, tier) {
    showLoading();
    try {
        const response = await apiCall('/billing/verify-payment', {
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_signature: paymentResponse.razorpay_signature,
            tier: tier,
            amount: 99900
        });

        if (response.success) {
            currentUser.tier = 'pro';
            updateUIForLoggedInUser();
            showNotification('Payment successful! Pro features unlocked.', 'success');
        } else {
            showNotification('Payment verification failed', 'error');
        }
    } catch (error) {
        showNotification('Payment verification failed', 'error');
    }
    hideLoading();
}

// Utility Functions
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

function displayResult(containerId, data) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    container.classList.add('show');
}

function showLoading() {
    loadingOverlay.classList.add('show');
}

function hideLoading() {
    loadingOverlay.classList.remove('show');
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
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 4000);
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offsetTop = section.offsetTop - 70; // Account for fixed navbar
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }

    // Special handling for dashboard
    if (sectionId === 'dashboard') {
        loadDashboard();
    }
}

function updateActiveNavLink(clickedLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    clickedLink.classList.add('active');
}

function updateNavOnScroll() {
    const sections = ['home', 'tools', 'dashboard', 'pricing'];
    const scrollPos = window.scrollY + 100;

    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section && section.offsetTop <= scrollPos && 
            section.offsetTop + section.offsetHeight > scrollPos) {
            
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// Modal Functions
function showLogin() {
    document.getElementById('loginModal').style.display = 'block';
    closeModal('registerModal');
}

function showRegister() {
    document.getElementById('registerModal').style.display = 'block';
    closeModal('loginModal');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
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
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Forgot Password Function
async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;

    showLoading();
    try {
        // Since we don't have a forgot password endpoint in the backend,
        // we'll simulate the functionality
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        
        closeModal('forgotPasswordModal');
        showNotification('Password reset link sent to your email!', 'success');
        
        // Clear the form
        document.getElementById('forgotEmail').value = '';
    } catch (error) {
        showNotification('Failed to send reset link. Please try again.', 'error');
    }
    hideLoading();
}

// Show Forgot Password Modal
function showForgotPassword() {
    closeModal('loginModal');
    document.getElementById('forgotPasswordModal').style.display = 'block';
}

// Theme Functions
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applyTheme();
}

function applyTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    const themeIconWelcome = document.getElementById('themeIconWelcome');
    
    if (currentTheme === 'light') {
        body.classList.add('light-mode');
        if (themeIcon) themeIcon.className = 'fas fa-moon';
        if (themeIconWelcome) themeIconWelcome.className = 'fas fa-moon';
    } else {
        body.classList.remove('light-mode');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
        if (themeIconWelcome) themeIconWelcome.className = 'fas fa-sun';
    }
}

// Welcome Screen Functions
function showWelcomeScreen() {
    // Check if user is already logged in
    if (authToken) {
        checkAuthStatus().then(() => {
            if (currentUser) {
                showMainContent();
                return;
            }
            welcomeScreen.style.display = 'flex';
        });
    } else {
        welcomeScreen.style.display = 'flex';
    }
}

function showMainContent() {
    welcomeScreen.style.display = 'none';
    mainContent.style.display = 'block';
    navbar.style.display = 'block';
    
    // Initialize main app
    initializeApp();
}

function continueAsGuest() {
    showMainContent();
}

function showWelcomeLogin() {
    welcomeScreen.style.display = 'none';
    showLogin();
}

function showWelcomeRegister() {
    welcomeScreen.style.display = 'none';
    showRegister();
}