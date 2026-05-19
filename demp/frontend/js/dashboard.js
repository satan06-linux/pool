// Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

async function initializeDashboard() {
    // Check authentication
    if (!authToken) {
        window.location.href = 'login.html';
        return;
    }

    try {
        await checkAuthStatus();
        
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }

        await loadDashboardData();
        updateAccountStatus();
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showNotification('Failed to load dashboard', 'error');
    }
}

async function loadDashboardData() {
    showLoading();
    
    try {
        const response = await apiCall('/dashboard', {}, 'GET');
        
        if (response.stats) {
            updateDashboardStats(response.stats);
        }
        
        if (response.recent_scans) {
            updateRecentScans(response.recent_scans);
        }
        
        showNotification('Dashboard loaded successfully', 'success');
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
        
        // Show default/empty state
        updateDashboardStats({
            total_scans: 0,
            scans_today: 0,
            high_risk: 0,
            avg_risk: 0
        });
        updateRecentScans([]);
    }
    
    hideLoading();
}

function updateDashboardStats(stats) {
    document.getElementById('totalScans').textContent = stats.total_scans || 0;
    document.getElementById('todayScans').textContent = stats.scans_today || 0;
    document.getElementById('highRisk').textContent = stats.high_risk || 0;
    document.getElementById('avgRisk').textContent = Math.round(stats.avg_risk || 0);
    
    // Update remaining scans
    const scanLimits = {
        'free': 5,
        'pro': 100,
        'business': 1000,
        'enterprise': '∞'
    };
    
    const userTier = currentUser?.tier || 'free';
    const dailyLimit = scanLimits[userTier];
    const scansUsed = stats.scans_today || 0;
    
    if (dailyLimit === '∞') {
        document.getElementById('remainingScans').textContent = 'Unlimited';
        document.getElementById('remainingScans').className = 'stat-change positive';
    } else {
        const remaining = Math.max(0, dailyLimit - scansUsed);
        document.getElementById('remainingScans').textContent = `${remaining} remaining`;
        document.getElementById('remainingScans').className = remaining > 0 ? 'stat-change positive' : 'stat-change negative';
    }
}

function updateRecentScans(scans) {
    const scansList = document.getElementById('scansList');
    
    if (!scans || scans.length === 0) {
        scansList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No scans yet</h3>
                <p>Start by running your first security scan</p>
                <a href="main.html#tools" class="btn btn-primary">Start Scanning</a>
            </div>
        `;
        return;
    }
    
    scansList.innerHTML = scans.map(scan => {
        const riskLevel = getRiskLevel(scan.risk_score);
        const riskClass = riskLevel.toLowerCase().replace(' ', '-');
        
        return `
            <div class="scan-item">
                <div class="scan-icon">
                    <i class="fas fa-${getScanIcon(scan.scan_type)}"></i>
                </div>
                <div class="scan-info">
                    <h4>${scan.target}</h4>
                    <p>${formatScanType(scan.scan_type)} • ${formatDate(scan.created_at)}</p>
                </div>
                <div class="scan-status">
                    <span class="risk-score risk-${riskClass}">${riskLevel}</span>
                    <span class="risk-percentage">${scan.risk_score}%</span>
                </div>
                <div class="scan-actions">
                    <button class="action-btn view" onclick="viewScanDetails(${scan.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateAccountStatus() {
    const userTier = currentUser?.tier || 'free';
    const tierBadge = document.getElementById('currentTier');
    const planDescription = document.getElementById('planDescription');
    const upgradeBtn = document.getElementById('upgradeBtn');
    
    // Update tier badge
    tierBadge.textContent = userTier.toUpperCase();
    tierBadge.className = `tier-badge tier-${userTier}`;
    
    // Update plan description
    const descriptions = {
        'free': 'Basic security tools with limited scans',
        'pro': 'Advanced security tools with unlimited scans',
        'business': 'Enterprise-grade security with priority support',
        'enterprise': 'Full platform access with custom features'
    };
    
    planDescription.textContent = descriptions[userTier] || descriptions.free;
    
    // Update upgrade button
    if (userTier === 'free') {
        upgradeBtn.style.display = 'block';
        upgradeBtn.innerHTML = '<i class="fas fa-crown"></i> Upgrade to Pro';
    } else if (userTier === 'pro') {
        upgradeBtn.style.display = 'block';
        upgradeBtn.innerHTML = '<i class="fas fa-building"></i> Upgrade to Business';
    } else {
        upgradeBtn.style.display = 'none';
    }
    
    // Update usage bar
    updateUsageBar();
    
    // Update security score (simulated)
    updateSecurityScore();
}

function updateUsageBar() {
    const scanLimits = {
        'free': 5,
        'pro': 100,
        'business': 1000
    };
    
    const userTier = currentUser?.tier || 'free';
    const dailyLimit = scanLimits[userTier];
    const scansUsed = parseInt(document.getElementById('todayScans').textContent) || 0;
    
    if (!dailyLimit) {
        document.getElementById('usageFill').style.width = '0%';
        document.getElementById('usageText').textContent = 'Unlimited scans';
        return;
    }
    
    const usagePercentage = Math.min((scansUsed / dailyLimit) * 100, 100);
    document.getElementById('usageFill').style.width = `${usagePercentage}%`;
    document.getElementById('usageText').textContent = `${scansUsed} of ${dailyLimit} scans used today`;
    
    // Update color based on usage
    const usageFill = document.getElementById('usageFill');
    if (usagePercentage >= 90) {
        usageFill.style.background = '#ef4444';
    } else if (usagePercentage >= 70) {
        usageFill.style.background = '#f59e0b';
    } else {
        usageFill.style.background = '#00d4ff';
    }
}

function updateSecurityScore() {
    // Simulated security score calculation
    const avgRisk = parseInt(document.getElementById('avgRisk').textContent) || 0;
    const securityScore = Math.max(0, 100 - avgRisk);
    
    document.getElementById('securityScore').textContent = securityScore;
    
    // Update score color
    const scoreElement = document.getElementById('securityScore');
    if (securityScore >= 80) {
        scoreElement.className = 'security-score good';
    } else if (securityScore >= 60) {
        scoreElement.className = 'security-score medium';
    } else {
        scoreElement.className = 'security-score poor';
    }
}

// Utility Functions
function getRiskLevel(score) {
    if (score >= 70) return 'High Risk';
    if (score >= 40) return 'Medium Risk';
    return 'Low Risk';
}

function getScanIcon(scanType) {
    const icons = {
        'phishing': 'fishing-hook',
        'comprehensive': 'shield-alt',
        'ssl': 'certificate',
        'password': 'key'
    };
    return icons[scanType] || 'search';
}

function formatScanType(scanType) {
    const types = {
        'phishing': 'Phishing Scan',
        'comprehensive': 'Full Security Scan',
        'ssl': 'SSL Audit',
        'password': 'Password Check'
    };
    return types[scanType] || scanType;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
}

// Action Functions
async function refreshScans() {
    await loadDashboardData();
}

function viewScanDetails(scanId) {
    showNotification(`Viewing scan details for ID: ${scanId}`, 'info');
    // Implement scan details modal or redirect
}

function upgradePlan() {
    const userTier = currentUser?.tier || 'free';
    
    if (userTier === 'free') {
        // Redirect to main page pricing section
        window.location.href = 'main.html#pricing';
    } else if (userTier === 'pro') {
        showNotification('Business plan upgrade coming soon!', 'info');
    }
}

// Add dashboard-specific styles
const dashboardStyles = `
    .dashboard-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 100px 20px 50px;
    }

    .dashboard-header {
        text-align: center;
        margin-bottom: 50px;
    }

    .dashboard-header h1 {
        color: #fff;
        font-size: 2.5rem;
        font-weight: 800;
        margin-bottom: 10px;
    }

    .dashboard-header p {
        color: #ccc;
        font-size: 1.1rem;
    }

    .quick-actions {
        margin: 50px 0;
    }

    .quick-actions h2 {
        color: #fff;
        font-size: 1.8rem;
        margin-bottom: 30px;
    }

    .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
    }

    .action-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        padding: 25px;
        text-decoration: none;
        color: #fff;
        transition: all 0.3s ease;
        position: relative;
    }

    .action-card:hover {
        transform: translateY(-5px);
        border-color: rgba(0, 212, 255, 0.5);
        box-shadow: 0 10px 30px rgba(0, 212, 255, 0.1);
    }

    .action-card.pro-action {
        border-color: rgba(255, 215, 0, 0.3);
    }

    .action-card.pro-action:hover {
        border-color: rgba(255, 215, 0, 0.7);
        box-shadow: 0 10px 30px rgba(255, 215, 0, 0.1);
    }

    .action-card i {
        font-size: 2rem;
        color: #00d4ff;
        margin-bottom: 15px;
    }

    .action-card h3 {
        font-size: 1.2rem;
        margin-bottom: 10px;
    }

    .action-card p {
        color: #ccc;
        font-size: 0.9rem;
        margin-bottom: 0;
    }

    .recent-scans {
        margin: 50px 0;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
    }

    .section-header h2 {
        color: #fff;
        font-size: 1.8rem;
    }

    .scans-list {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        padding: 20px;
    }

    .scan-item {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 20px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .scan-item:last-child {
        border-bottom: none;
    }

    .scan-icon {
        width: 50px;
        height: 50px;
        background: rgba(0, 212, 255, 0.2);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #00d4ff;
        font-size: 1.2rem;
    }

    .scan-info {
        flex: 1;
    }

    .scan-info h4 {
        color: #fff;
        font-size: 1rem;
        margin-bottom: 5px;
    }

    .scan-info p {
        color: #ccc;
        font-size: 0.9rem;
    }

    .scan-status {
        text-align: right;
    }

    .risk-percentage {
        display: block;
        color: #999;
        font-size: 0.8rem;
        margin-top: 5px;
    }

    .scan-actions {
        display: flex;
        gap: 10px;
    }

    .empty-state {
        text-align: center;
        padding: 60px 20px;
    }

    .empty-state i {
        font-size: 3rem;
        color: #666;
        margin-bottom: 20px;
    }

    .empty-state h3 {
        color: #fff;
        font-size: 1.5rem;
        margin-bottom: 10px;
    }

    .empty-state p {
        color: #ccc;
        margin-bottom: 30px;
    }

    .account-status {
        margin: 50px 0;
    }

    .account-status h2 {
        color: #fff;
        font-size: 1.8rem;
        margin-bottom: 30px;
    }

    .status-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 30px;
    }

    .status-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        padding: 25px;
    }

    .status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .status-header h3 {
        color: #fff;
        font-size: 1.2rem;
    }

    .status-content {
        margin-bottom: 25px;
    }

    .status-content p {
        color: #ccc;
        margin-bottom: 15px;
    }

    .usage-bar {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 10px;
    }

    .usage-fill {
        height: 100%;
        background: #00d4ff;
        border-radius: 4px;
        transition: width 0.3s ease;
    }

    .usage-text {
        color: #999;
        font-size: 0.9rem;
    }

    .security-score {
        font-size: 2rem;
        font-weight: 700;
    }

    .security-score.good {
        color: #22c55e;
    }

    .security-score.medium {
        color: #f59e0b;
    }

    .security-score.poor {
        color: #ef4444;
    }

    .score-breakdown {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .score-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #ccc;
        font-size: 0.9rem;
    }

    .score-value {
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
    }

    .score-value.good {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
    }

    .score-value.medium {
        background: rgba(251, 191, 36, 0.2);
        color: #fbbf24;
    }

    .score-value.low {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
    }

    /* Light Mode */
    body.light-mode .dashboard-header h1,
    body.light-mode .quick-actions h2,
    body.light-mode .section-header h2,
    body.light-mode .account-status h2 {
        color: #1e293b;
    }

    body.light-mode .dashboard-header p {
        color: #64748b;
    }

    body.light-mode .action-card,
    body.light-mode .scans-list,
    body.light-mode .status-card {
        background: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(0, 0, 0, 0.1);
        color: #1e293b;
    }

    body.light-mode .action-card p,
    body.light-mode .scan-info p,
    body.light-mode .status-content p {
        color: #64748b;
    }

    body.light-mode .scan-info h4,
    body.light-mode .status-header h3,
    body.light-mode .empty-state h3 {
        color: #1e293b;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
        .dashboard-container {
            padding: 100px 15px 50px;
        }

        .dashboard-header h1 {
            font-size: 2rem;
        }

        .actions-grid {
            grid-template-columns: 1fr;
        }

        .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
        }

        .scan-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
        }

        .scan-status {
            text-align: left;
            width: 100%;
        }

        .status-grid {
            grid-template-columns: 1fr;
        }
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = dashboardStyles;
document.head.appendChild(styleSheet);