// Main Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeMainPage();
});

function initializeMainPage() {
    setupEventListeners();
    checkAuthStatus();
    
    // Mobile menu toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu) {
                navMenu.classList.remove('active');
            }
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const userMenu = document.querySelector('.user-menu');
        const dropdownMenu = document.getElementById('dropdownMenu');
        
        if (userMenu && dropdownMenu && !userMenu.contains(event.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = e.target.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = href.substring(1);
                scrollToSection(target);
                updateActiveNavLink(e.target);
            }
        });
    });

    // Scroll spy for navigation
    window.addEventListener('scroll', updateNavOnScroll);
}

// Tool Functions
async function scanPhishing() {
    const url = document.getElementById('phishingUrl').value.trim();
    if (!url) {
        showNotification('Please enter a URL', 'error');
        return;
    }

    if (!isValidUrl(url)) {
        showNotification('Please enter a valid URL', 'error');
        return;
    }

    showLoading();
    try {
        const response = await apiCall('/free/phishing-scan', { url });
        displayResult('phishingResult', response);
        
        if (response.is_phishing) {
            showNotification('⚠️ Phishing detected! This URL appears to be malicious.', 'error');
        } else {
            showNotification('✅ URL appears to be safe.', 'success');
        }
    } catch (error) {
        showNotification('Scan failed. Please try again.', 'error');
        console.error('Phishing scan error:', error);
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
        
        const strength = response.strength.toLowerCase();
        if (strength === 'very weak' || strength === 'weak') {
            showNotification('💡 Consider using a stronger password', 'info');
        } else if (strength === 'good' || strength === 'strong') {
            showNotification('✅ Good password strength!', 'success');
        }
    } catch (error) {
        showNotification('Analysis failed. Please try again.', 'error');
        console.error('Password check error:', error);
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
        showNotification('✅ Hash generated successfully!', 'success');
    } catch (error) {
        showNotification('Hash generation failed. Please try again.', 'error');
        console.error('Hash generation error:', error);
    }
    hideLoading();
}

async function fullSecurityScan() {
    if (!authToken) {
        showNotification('Please login to use Pro features', 'error');
        window.location.href = 'login.html';
        return;
    }

    if (!currentUser || currentUser.tier === 'free') {
        showNotification('Upgrade to Pro to use this feature', 'error');
        scrollToSection('pricing');
        return;
    }

    const url = document.getElementById('fullScanUrl').value.trim();
    if (!url) {
        showNotification('Please enter a URL', 'error');
        return;
    }

    if (!isValidUrl(url)) {
        showNotification('Please enter a valid URL', 'error');
        return;
    }

    showLoading();
    try {
        const response = await apiCall('/pro/full-security-scan', { url });
        displayResult('fullScanResult', response);
        
        if (response.scans_remaining !== undefined) {
            showNotification(`✅ Scan complete! ${response.scans_remaining} scans remaining today.`, 'success');
        } else {
            showNotification('✅ Comprehensive security scan completed!', 'success');
        }
    } catch (error) {
        if (error.status === 402) {
            showNotification('Daily scan limit reached. Upgrade your plan for more scans.', 'error');
        } else if (error.status === 401) {
            showNotification('Please login to use Pro features', 'error');
            window.location.href = 'login.html';
        } else {
            showNotification('Scan failed. Please try again.', 'error');
        }
        console.error('Full scan error:', error);
    }
    hideLoading();
}

async function sslAudit() {
    if (!authToken) {
        showNotification('Please login to use Pro features', 'error');
        window.location.href = 'login.html';
        return;
    }

    if (!currentUser || currentUser.tier === 'free') {
        showNotification('Upgrade to Pro to use this feature', 'error');
        scrollToSection('pricing');
        return;
    }

    const url = document.getElementById('sslUrl').value.trim();
    if (!url) {
        showNotification('Please enter a URL', 'error');
        return;
    }

    if (!isValidUrl(url)) {
        showNotification('Please enter a valid URL', 'error');
        return;
    }

    showLoading();
    try {
        const response = await apiCall('/pro/ssl-audit', { url });
        displayResult('sslResult', response);
        showNotification('✅ SSL audit completed!', 'success');
    } catch (error) {
        if (error.status === 402) {
            showNotification('Daily scan limit reached. Upgrade your plan for more scans.', 'error');
        } else if (error.status === 401) {
            showNotification('Please login to use Pro features', 'error');
            window.location.href = 'login.html';
        } else {
            showNotification('SSL audit failed. Please try again.', 'error');
        }
        console.error('SSL audit error:', error);
    }
    hideLoading();
}

// Billing Functions
async function upgradeToPro() {
    if (!authToken) {
        showNotification('Please login first', 'error');
        window.location.href = 'login.html';
        return;
    }

    showLoading();
    try {
        const response = await apiCall('/billing/create-order', { 
            amount: 99900, // ₹999 in paise
            tier: 'pro' 
        });
        
        // Check if Razorpay is loaded
        if (typeof Razorpay === 'undefined') {
            showNotification('Payment system not loaded. Please refresh and try again.', 'error');
            hideLoading();
            return;
        }
        
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
            },
            modal: {
                ondismiss: function() {
                    hideLoading();
                }
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
    } catch (error) {
        showNotification('Failed to create payment order', 'error');
        console.error('Payment creation error:', error);
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
            showNotification('🎉 Payment successful! Pro features unlocked.', 'success');
            
            // Refresh the page to update UI
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showNotification('Payment verification failed', 'error');
        }
    } catch (error) {
        showNotification('Payment verification failed', 'error');
        console.error('Payment verification error:', error);
    }
    hideLoading();
}

// Utility Functions
function displayResult(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    container.classList.add('show');
    
    // Auto scroll to result
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
}

function updateActiveNavLink(clickedLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    clickedLink.classList.add('active');
}

function updateNavOnScroll() {
    const sections = ['home', 'tools', 'pricing'];
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

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Close welcome message
function closeWelcomeMessage() {
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.style.display = 'none';
    }
}

// Load Razorpay script dynamically
function loadRazorpay() {
    return new Promise((resolve, reject) => {
        if (typeof Razorpay !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Load Razorpay when page loads
loadRazorpay().catch(error => {
    console.warn('Failed to load Razorpay:', error);
});