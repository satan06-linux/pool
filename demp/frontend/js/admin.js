// Admin Dashboard JavaScript

let adminData = {
    users: [],
    scans: [],
    subscriptions: [],
    stats: {}
};

document.addEventListener('DOMContentLoaded', function() {
    initializeAdminDashboard();
});

async function initializeAdminDashboard() {
    // Check if user is admin
    if (!authToken) {
        window.location.href = 'login.html';
        return;
    }

    try {
        await checkAuthStatus();
        
        if (!currentUser || !currentUser.is_admin) {
            showNotification('Admin access required', 'error');
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 2000);
            return;
        }

        setupEventListeners();
        await loadDashboardData();
        initializeCharts();
        
    } catch (error) {
        console.error('Admin initialization error:', error);
        showNotification('Failed to initialize admin dashboard', 'error');
    }
}

function setupEventListeners() {
    // Sidebar menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (section) {
                showSection(section);
            }
        });
    });

    // Search and filter inputs
    const userSearch = document.getElementById('userSearch');
    const tierFilter = document.getElementById('tierFilter');
    const scanSearch = document.getElementById('scanSearch');
    const scanTypeFilter = document.getElementById('scanTypeFilter');
    const riskFilter = document.getElementById('riskFilter');

    if (userSearch) {
        userSearch.addEventListener('input', debounce(filterUsers, 300));
    }
    if (tierFilter) {
        tierFilter.addEventListener('change', filterUsers);
    }
    if (scanSearch) {
        scanSearch.addEventListener('input', debounce(filterScans, 300));
    }
    if (scanTypeFilter) {
        scanTypeFilter.addEventListener('change', filterScans);
    }
    if (riskFilter) {
        riskFilter.addEventListener('change', filterScans);
    }
}

async function loadDashboardData() {
    showLoading();
    
    try {
        // Load admin stats
        const statsResponse = await apiCall('/admin/stats', {}, 'GET');
        adminData.stats = statsResponse;
        updateOverviewStats(statsResponse);

        // Load users
        const usersResponse = await apiCall('/admin/users', {}, 'GET');
        adminData.users = usersResponse.users || [];
        updateUsersTable(adminData.users);

        // Load recent activity (simulated)
        updateRecentActivity();

        showNotification('Dashboard data loaded successfully', 'success');
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
    
    hideLoading();
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeMenuItem = document.querySelector(`[onclick*="${sectionId}"]`);
    if (activeMenuItem) {
        activeMenuItem.classList.add('active');
    }

    // Load section-specific data
    switch (sectionId) {
        case 'users':
            loadUsersData();
            break;
        case 'scans':
            loadScansData();
            break;
        case 'subscriptions':
            loadSubscriptionsData();
            break;
        case 'analytics':
            updateAnalyticsCharts();
            break;
    }
}

function updateOverviewStats(stats) {
    document.getElementById('totalUsers').textContent = stats.total_users || 0;
    document.getElementById('proUsers').textContent = stats.pro_users || 0;
    document.getElementById('totalScans').textContent = stats.total_scans || 0;
    document.getElementById('revenue').textContent = `₹${(stats.revenue * 999 || 0).toLocaleString()}`;

    // Update growth percentages (simulated)
    document.getElementById('userGrowth').textContent = '+12%';
    document.getElementById('proGrowth').textContent = '+8%';
    document.getElementById('scanGrowth').textContent = '+25%';
    document.getElementById('revenueGrowth').textContent = '+15%';
}

function updateUsersTable(users) {
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="user-avatar">${user.full_name?.charAt(0) || user.email.charAt(0)}</div>
                    <div>
                        <div style="font-weight: 600; color: #fff;">${user.full_name || 'N/A'}</div>
                        <div style="font-size: 0.8rem; color: #999;">${user.email}</div>
                    </div>
                </div>
            </td>
            <td>${user.email}</td>
            <td><span class="tier-badge tier-${user.tier}">${user.tier}</span></td>
            <td>${user.total_scans || 0}</td>
            <td>${new Date(user.created_at || Date.now()).toLocaleDateString()}</td>
            <td>
                <button class="action-btn view" onclick="viewUser(${user.id})">View</button>
                <button class="action-btn edit" onclick="editUser(${user.id})">Edit</button>
                ${!user.is_admin ? `<button class="action-btn delete" onclick="deleteUser(${user.id})">Delete</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function updateRecentActivity() {
    const activityList = document.getElementById('recentActivity');
    if (!activityList) return;

    const activities = [
        {
            icon: 'fas fa-user-plus',
            title: 'New user registered',
            description: 'john.doe@example.com joined the platform',
            time: '2 minutes ago'
        },
        {
            icon: 'fas fa-search',
            title: 'Security scan completed',
            description: 'Full scan on example.com - High risk detected',
            time: '5 minutes ago'
        },
        {
            icon: 'fas fa-crown',
            title: 'Pro subscription activated',
            description: 'user@company.com upgraded to Pro plan',
            time: '10 minutes ago'
        },
        {
            icon: 'fas fa-shield-alt',
            title: 'SSL audit performed',
            description: 'SSL certificate check on secure-site.com',
            time: '15 minutes ago'
        }
    ];

    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
            </div>
            <div class="activity-time">${activity.time}</div>
        </div>
    `).join('');
}

async function loadUsersData() {
    try {
        const response = await apiCall('/admin/users', {}, 'GET');
        adminData.users = response.users || [];
        updateUsersTable(adminData.users);
    } catch (error) {
        console.error('Failed to load users:', error);
        showNotification('Failed to load users data', 'error');
    }
}

async function loadScansData() {
    // Simulated scans data
    const scans = [
        {
            id: 1,
            target: 'example.com',
            scan_type: 'comprehensive',
            user_email: 'user@example.com',
            risk_score: 75,
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            target: 'test-site.org',
            scan_type: 'phishing',
            user_email: 'admin@test.com',
            risk_score: 25,
            created_at: new Date(Date.now() - 3600000).toISOString()
        }
    ];

    updateScansTable(scans);
}

function updateScansTable(scans) {
    const tbody = document.getElementById('scansTable');
    if (!tbody) return;

    tbody.innerHTML = scans.map(scan => {
        const riskLevel = scan.risk_score > 70 ? 'high' : scan.risk_score > 40 ? 'medium' : 'low';
        return `
            <tr>
                <td>${scan.target}</td>
                <td><span class="tier-badge tier-${scan.scan_type}">${scan.scan_type}</span></td>
                <td>${scan.user_email}</td>
                <td><span class="risk-score risk-${riskLevel}">${scan.risk_score}%</span></td>
                <td>${new Date(scan.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn view" onclick="viewScan(${scan.id})">View</button>
                    <button class="action-btn delete" onclick="deleteScan(${scan.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadSubscriptionsData() {
    // Update subscription stats
    document.getElementById('activeSubscriptions').textContent = adminData.stats.pro_users || 0;
    document.getElementById('monthlyRevenue').textContent = `₹${((adminData.stats.pro_users || 0) * 999).toLocaleString()}`;
    document.getElementById('churnRate').textContent = '2.5%';

    // Simulated subscriptions data
    const subscriptions = [
        {
            id: 1,
            user_email: 'pro.user@example.com',
            tier: 'pro',
            status: 'active',
            amount: 999,
            created_at: new Date().toISOString()
        }
    ];

    updateSubscriptionsTable(subscriptions);
}

function updateSubscriptionsTable(subscriptions) {
    const tbody = document.getElementById('subscriptionsTable');
    if (!tbody) return;

    tbody.innerHTML = subscriptions.map(sub => `
        <tr>
            <td>${sub.user_email}</td>
            <td><span class="tier-badge tier-${sub.tier}">${sub.tier}</span></td>
            <td><span class="tier-badge tier-${sub.status}">${sub.status}</span></td>
            <td>₹${sub.amount}</td>
            <td>${new Date(sub.created_at).toLocaleDateString()}</td>
            <td>
                <button class="action-btn view" onclick="viewSubscription(${sub.id})">View</button>
                <button class="action-btn edit" onclick="editSubscription(${sub.id})">Edit</button>
            </td>
        </tr>
    `).join('');
}

function initializeCharts() {
    // User Growth Chart
    const userGrowthCtx = document.getElementById('userGrowthChart');
    if (userGrowthCtx) {
        new Chart(userGrowthCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Users',
                    data: [12, 19, 25, 32, 45, 52],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: '#fff' }
                    }
                },
                scales: {
                    x: { ticks: { color: '#ccc' } },
                    y: { ticks: { color: '#ccc' } }
                }
            }
        });
    }

    // Scan Activity Chart
    const scanActivityCtx = document.getElementById('scanActivityChart');
    if (scanActivityCtx) {
        new Chart(scanActivityCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Scans',
                    data: [65, 59, 80, 81, 56, 55, 40],
                    backgroundColor: 'rgba(0, 212, 255, 0.6)',
                    borderColor: '#00d4ff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: '#fff' }
                    }
                },
                scales: {
                    x: { ticks: { color: '#ccc' } },
                    y: { ticks: { color: '#ccc' } }
                }
            }
        });
    }
}

function updateAnalyticsCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue (₹)',
                    data: [12000, 19000, 25000, 32000, 45000, 52000],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: '#fff' }
                    }
                },
                scales: {
                    x: { ticks: { color: '#ccc' } },
                    y: { ticks: { color: '#ccc' } }
                }
            }
        });
    }

    // User Distribution Chart
    const userDistCtx = document.getElementById('userDistributionChart');
    if (userDistCtx) {
        new Chart(userDistCtx, {
            type: 'doughnut',
            data: {
                labels: ['Free', 'Pro', 'Business'],
                datasets: [{
                    data: [70, 25, 5],
                    backgroundColor: ['#6b7280', '#ffd700', '#a78bfa'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: '#fff' }
                    }
                }
            }
        });
    }

    // Scan Types Chart
    const scanTypesCtx = document.getElementById('scanTypesChart');
    if (scanTypesCtx) {
        new Chart(scanTypesCtx, {
            type: 'pie',
            data: {
                labels: ['Phishing', 'Full Scan', 'SSL Audit'],
                datasets: [{
                    data: [45, 35, 20],
                    backgroundColor: ['#ef4444', '#00d4ff', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: '#fff' }
                    }
                }
            }
        });
    }
}

// Filter Functions
function filterUsers() {
    const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const tierFilter = document.getElementById('tierFilter')?.value || '';
    
    const filteredUsers = adminData.users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm) || 
                            (user.full_name || '').toLowerCase().includes(searchTerm);
        const matchesTier = !tierFilter || user.tier === tierFilter;
        
        return matchesSearch && matchesTier;
    });
    
    updateUsersTable(filteredUsers);
}

function filterScans() {
    // Implementation for scan filtering
    console.log('Filtering scans...');
}

// Action Functions
function viewUser(userId) {
    const user = adminData.users.find(u => u.id === userId);
    if (user) {
        showNotification(`Viewing user: ${user.email}`, 'info');
        // Implement user details modal
    }
}

function editUser(userId) {
    showNotification(`Editing user ID: ${userId}`, 'info');
    // Implement user edit modal
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        showNotification(`User ${userId} deleted`, 'success');
        // Implement user deletion
    }
}

function viewScan(scanId) {
    showNotification(`Viewing scan ID: ${scanId}`, 'info');
    // Implement scan details modal
}

function deleteScan(scanId) {
    if (confirm('Are you sure you want to delete this scan?')) {
        showNotification(`Scan ${scanId} deleted`, 'success');
        // Implement scan deletion
    }
}

function viewSubscription(subId) {
    showNotification(`Viewing subscription ID: ${subId}`, 'info');
}

function editSubscription(subId) {
    showNotification(`Editing subscription ID: ${subId}`, 'info');
}

// Export Functions
function exportUsers() {
    const csvContent = "data:text/csv;charset=utf-8," + 
        "Name,Email,Tier,Total Scans,Join Date\n" +
        adminData.users.map(user => 
            `"${user.full_name || ''}","${user.email}","${user.tier}","${user.total_scans || 0}","${new Date(user.created_at || Date.now()).toLocaleDateString()}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Users exported successfully', 'success');
}

function exportScans() {
    showNotification('Scans exported successfully', 'success');
}

function refreshUsers() {
    loadUsersData();
    showNotification('Users data refreshed', 'success');
}

// Settings Functions
function updateScanLimits() {
    const freeLimit = document.getElementById('freeScanLimit').value;
    const proLimit = document.getElementById('proScanLimit').value;
    
    showNotification(`Scan limits updated: Free=${freeLimit}, Pro=${proLimit}`, 'success');
}

function updatePricing() {
    const proPrice = document.getElementById('proPrice').value;
    const businessPrice = document.getElementById('businessPrice').value;
    
    showNotification(`Pricing updated: Pro=₹${proPrice}, Business=₹${businessPrice}`, 'success');
}

function clearCache() {
    showNotification('Cache cleared successfully', 'success');
}

function exportData() {
    showNotification('Data export initiated', 'info');
}

function maintenanceMode() {
    if (confirm('Enable maintenance mode? This will make the platform unavailable to users.')) {
        showNotification('Maintenance mode enabled', 'info');
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load Chart.js dynamically
function loadChartJS() {
    return new Promise((resolve, reject) => {
        if (typeof Chart !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Load Chart.js when page loads
loadChartJS().then(() => {
    console.log('Chart.js loaded successfully');
}).catch(error => {
    console.warn('Failed to load Chart.js:', error);
});