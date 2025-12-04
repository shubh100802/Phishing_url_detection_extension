// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    ensureAuthenticated();
    applyAdminHeader();
    initializeDashboard();
    loadSampleData();
    initializeModals();
});

function getCurrentUser() {
    try {
        const raw = localStorage.getItem('currentUser');
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function ensureAuthenticated() {
    const user = getCurrentUser();
    const token = localStorage.getItem('accessToken');
    if (!user || !token || user.role !== 'admin') {
        // Not logged in or not admin
        window.location.href = '../adminlogin.html';
    }
}

// Backend API helpers
const API_BASES = [
    `http://localhost:${Number(location.search.match(/port=(\d+)/)?.[1]) || 3001}`,
    'http://localhost:3000'
];

async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('accessToken') || '';
    const headers = Object.assign({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, options.headers || {});
    let lastErr;
    for (const base of API_BASES) {
        try {
            const res = await fetch(base + path, Object.assign({}, options, { headers }));
            if (res.status === 401) {
                try {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('currentUser');
                } catch {}
                showNotification('Session expired. Please log in again.', 'error');
                setTimeout(() => { window.location.href = '../adminlogin.html'; }, 500);
                return res;
            }
            return res;
        } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('Network error');
}

function applyAdminHeader() {
    const user = getCurrentUser();
    if (!user) return;
    const nameEl = document.querySelector('.admin-details .admin-name');
    const roleEl = document.querySelector('.admin-details .admin-role');
    if (nameEl) nameEl.textContent = user.name || user.username || user.email || 'Admin';
    if (roleEl) roleEl.textContent = 'System Admin';
}

// Initialize dashboard functionality
function initializeDashboard() {
    // Navigation functionality
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            navigateToSection(section);
        });
    });

    // Auto-refresh stats every 30 seconds
    setInterval(refreshStats, 30000);
}

// Modal helpers and bindings
function initializeModals() {
    // Scan modal
    const scanModal = document.getElementById('scanModal');
    const scanForm = document.getElementById('scanForm');
    const scanCancelBtn = document.getElementById('scanCancelBtn');
    if (scanForm) {
        scanForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('scanUrlInput').value.trim();
            const deepScan = document.getElementById('scanDeepInput').checked;
            const saveHistory = document.getElementById('scanSaveInput').checked;
            if (!url) return;
            try {
                showNotification('Scanning URL: ' + url, 'info');
                const res = await apiFetch('/api/scan', { method: 'POST', body: JSON.stringify({ url, deepScan, saveHistory }) });
                if (!res.ok) throw new Error('Scan failed');
                const data = await res.json();
                showNotification(`Scan complete: ${data.verdict.toUpperCase()} (risk ${data.riskScore})`, 'success');
                if (scanModal) scanModal.style.display = 'none';
                loadThreatsData();
            } catch {
                showNotification('URL scan failed', 'error');
            }
        });
    }
    if (scanCancelBtn) scanCancelBtn.addEventListener('click', () => { if (scanModal) scanModal.style.display = 'none'; });

    // Threat update modal
    const threatModal = document.getElementById('threatModal');
    const threatForm = document.getElementById('threatForm');
    const threatCancelBtn = document.getElementById('threatCancelBtn');
    if (threatForm) {
        threatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('threatIdInput').value;
            const status = document.getElementById('threatStatusInput').value;
            const level = document.getElementById('threatLevelInput').value;
            const notes = document.getElementById('threatNotesInput').value;
            if (!id) return;
            try {
                const res = await apiFetch(`/api/threats/${id}`, { method: 'PATCH', body: JSON.stringify({ status, level, notes }) });
                if (!res.ok) throw new Error('Update failed');
                showNotification('Threat updated successfully', 'success');
                if (threatModal) threatModal.style.display = 'none';
                loadThreatsData();
            } catch {
                showNotification('Failed to update threat', 'error');
            }
        });
    }
    if (threatCancelBtn) threatCancelBtn.addEventListener('click', () => { if (threatModal) threatModal.style.display = 'none'; });

    // Add user modal
    const userModal = document.getElementById('userModal');
    const userForm = document.getElementById('userForm');
    const userCancelBtn = document.getElementById('userCancelBtn');
    if (userForm) {
        userForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('userNameInput').value.trim();
            const email = document.getElementById('userEmailInput').value.trim();
            const role = document.getElementById('userRoleInput').value;
            if (!name || !email || !role) return;
            try {
                const res = await apiFetch('/api/users', { method: 'POST', body: JSON.stringify({ name, email, role }) });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err?.message || 'Create user failed');
                }
                showNotification(`User ${name} added successfully`, 'success');
                if (userModal) userModal.style.display = 'none';
                userForm.reset();
                loadUsersData();
            } catch {
                showNotification('Failed to add user', 'error');
            }
        });
    }
    if (userCancelBtn) userCancelBtn.addEventListener('click', () => { if (userModal) userModal.style.display = 'none'; });
}

// Navigate to different sections
function navigateToSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update navigation active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });

    const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }

    // Update page title and description
    updatePageHeader(sectionName);

    // Lazy refresh data when switching sections
    if (sectionName === 'overview') loadOverview();
    if (sectionName === 'threats') loadThreatsData();
    if (sectionName === 'users') loadUsersData();
}

// Update page header based on section
function updatePageHeader(sectionName) {
    const pageTitle = document.getElementById('pageTitle');
    const pageDescription = document.getElementById('pageDescription');

    const sectionData = {
        overview: {
            title: 'Dashboard Overview',
            description: 'Monitor system status and recent activities'
        },
        threats: {
            title: 'Threat Management',
            description: 'Monitor and manage detected threats'
        },
        analytics: {
            title: 'Analytics & Reports',
            description: 'View detailed analytics and generate reports'
        },
        users: {
            title: 'User Management',
            description: 'Manage user accounts and permissions'
        },
        settings: {
            title: 'System Settings',
            description: 'Configure system parameters and preferences'
        }
    };

    if (sectionData[sectionName]) {
        pageTitle.textContent = sectionData[sectionName].title;
        pageDescription.textContent = sectionData[sectionName].description;
    }
}

function loadSampleData() {
    loadOverview();
    loadThreatsData();
    loadUsersData();
}

// Load threats data
async function loadThreatsData() {
    const tableBody = document.getElementById('threatsTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5">Loading threats...</td></tr>';
    try {
        const res = await apiFetch('/api/threats', { method: 'GET' });
        if (!res.ok) throw new Error('Failed to load threats');
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        tableBody.innerHTML = '';
        items.forEach(threat => {
            const row = document.createElement('tr');
            const level = (threat.level || '').toLowerCase();
            const status = (threat.status || '').toLowerCase().replace(' ', '-');
            const detected = threat.detectedAt ? new Date(threat.detectedAt).toLocaleString() : '';
            row.innerHTML = `
                <td>${threat.url}</td>
                <td><span class="threat-level ${level}">${(threat.level || '').replace(/\b\w/g, c => c.toUpperCase())}</span></td>
                <td>${detected}</td>
                <td><span class="status ${status}">${(threat.status || '').replace(/\b\w/g, c => c.toUpperCase())}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewThreatDetails('${threat._id || ''}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="updateThreatStatus('${threat._id || ''}')">Update</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        if (!items.length) {
            tableBody.innerHTML = '<tr><td colspan="5">No threats found</td></tr>';
        }
    } catch (e) {
        tableBody.innerHTML = '<tr><td colspan="5">Error loading threats</td></tr>';
        showNotification('Failed to load threats', 'error');
    }
}

// Load users data
async function loadUsersData() {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="6">Loading users...</td></tr>';
    try {
        const res = await apiFetch('/api/users', { method: 'GET' });
        if (!res.ok) throw new Error('Failed to load users');
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        tableBody.innerHTML = '';
        items.forEach(user => {
            const role = (user.role || '').toLowerCase();
            const status = (user.status || '').toLowerCase();
            const lastLogin = user.updatedAt ? new Date(user.updatedAt).toLocaleString() : '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name || ''}</td>
                <td>${user.email || ''}</td>
                <td><span class="role ${role}">${(user.role || '').replace(/\b\w/g, c => c.toUpperCase())}</span></td>
                <td><span class="status ${status}">${(user.status || '').replace(/\b\w/g, c => c.toUpperCase())}</span></td>
                <td>${lastLogin}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editUser('${user._id}')">Edit</button>
                    <button class="btn btn-sm btn-secondary" onclick="viewUserDetails('${user._id}')">View</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        if (!items.length) {
            tableBody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
        }
    } catch (e) {
        tableBody.innerHTML = '<tr><td colspan="6">Error loading users</td></tr>';
        showNotification('Failed to load users', 'error');
    }
}

// Refresh dashboard stats
function refreshStats() {
    // Pull fresh analytics and update overview numbers
    loadOverview(true);
}

// Load overview analytics
async function loadOverview(isRefresh = false) {
    const statsGrid = document.querySelector('#overview .stats-grid');
    const activityList = document.querySelector('#overview .activity-list');
    try {
        const res = await apiFetch('/api/analytics', { method: 'GET' });
        if (!res.ok) throw new Error('Failed to load analytics');
        const data = await res.json();
        const s = data.stats || {};

        // Update stat cards in order: Total Threats, Blocked Attacks, Active Users, Uptime
        const numbers = document.querySelectorAll('#overview .stat-card .stat-number');
        if (numbers[0]) numbers[0].textContent = Number(s.totalThreats || 0).toLocaleString();
        if (numbers[1]) numbers[1].textContent = Number(s.blockedThreats || 0).toLocaleString();
        if (numbers[2]) numbers[2].textContent = Number(s.activeUsers || 0).toLocaleString();
        if (numbers[3]) numbers[3].textContent = (s.uptimePercent != null ? s.uptimePercent : 99.9) + '%';

        // Recent activity
        if (activityList) {
            activityList.innerHTML = '';
            const items = Array.isArray(data.activities) ? data.activities : [];
            if (!items.length) {
                activityList.innerHTML = '<div class="activity-item"><div class="activity-content"><p>No recent activity</p></div></div>';
            } else {
                items.forEach(a => {
                    const icon = a.type === 'threat' ? '🛡️' : a.type === 'scan' ? '🔎' : 'ℹ️';
                    const time = a.time ? new Date(a.time).toLocaleString() : '';
                    const el = document.createElement('div');
                    el.className = 'activity-item';
                    el.innerHTML = `
                        <div class="activity-icon ${a.type}">${icon}</div>
                        <div class="activity-content">
                            <h4>${a.title || ''}</h4>
                            <p>${a.message || ''}</p>
                            <span class="activity-time">${time}</span>
                        </div>
                    `;
                    activityList.appendChild(el);
                });
            }
        }
    } catch (e) {
        if (!isRefresh && statsGrid) {
            // show a minimal inline error state (no alerts to reduce noise)
        }
    }
}

// Threat management functions
function scanNewURL() {
    const scanModal = document.getElementById('scanModal');
    const urlInput = document.getElementById('scanUrlInput');
    if (urlInput) urlInput.value = '';
    if (scanModal) scanModal.style.display = 'block';
}

function viewThreatDetails(url) {
    showNotification(`Viewing details for: ${url}`, 'info');
    // In a real application, this would open a detailed modal
}

function updateThreatStatus(id) {
    const threatModal = document.getElementById('threatModal');
    const idInput = document.getElementById('threatIdInput');
    const notesInput = document.getElementById('threatNotesInput');
    if (idInput) idInput.value = id;
    if (notesInput) notesInput.value = '';
    if (threatModal) threatModal.style.display = 'block';
}

// User management functions
function addNewUser() {
    const userModal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    if (form) form.reset();
    if (userModal) userModal.style.display = 'block';
}

function editUser(email) {
    showNotification(`Editing user: ${email}`, 'info');
    // In a real application, this would open an edit modal
}

function viewUserDetails(email) {
    showNotification(`Viewing details for: ${email}`, 'info');
    // In a real application, this would open a detailed modal
}

// Settings functions
function saveSettings() {
    const autoBlock = document.getElementById('autoBlock').checked;
    const emailNotifications = document.getElementById('emailNotifications').checked;
    const threatThreshold = document.getElementById('threatThreshold').value;
    const dataRetention = document.getElementById('dataRetention').value;
    const backupFrequency = document.getElementById('backupFrequency').value;

    // Simulate saving settings
    showNotification('Settings saved successfully', 'success');
    
    // Log settings to console for demonstration
    console.log('Settings saved:', {
        autoBlock,
        emailNotifications,
        threatThreshold,
        dataRetention,
        backupFrequency
    });
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;

    // Add keyframes for animation
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Logout function
function logout() {
    if (!confirm('Are you sure you want to logout?')) return;
    showNotification('Logging out...', 'info');
    try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('admin_username');
        localStorage.removeItem('admin_password');
        localStorage.removeItem('admin_remember');
    } catch {}
    setTimeout(() => {
        window.location.href = '../adminlogin.html';
    }, 500);
}

// Add CSS for threat levels and statuses
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .threat-level.high {
            background: #fee2e2;
            color: #dc2626;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .threat-level.medium {
            background: #fef3c7;
            color: #d97706;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .threat-level.low {
            background: #dcfce7;
            color: #16a34a;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .status.blocked {
            background: #fee2e2;
            color: #dc2626;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .status.under-review {
            background: #fef3c7;
            color: #d97706;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .status.monitored {
            background: #dbeafe;
            color: #2563eb;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .status.active {
            background: #dcfce7;
            color: #16a34a;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .status.inactive {
            background: #f3f4f6;
            color: #6b7280;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .role.user {
            background: #dbeafe;
            color: #2563eb;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .role.moderator {
            background: #fef3c7;
            color: #d97706;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .role.admin {
            background: #fee2e2;
            color: #dc2626;
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .btn-sm {
            padding: 0.5rem 1rem;
            font-size: 0.75rem;
            margin-right: 0.5rem;
        }
        
        .btn-secondary {
            background: #6b7280;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #4b5563;
        }
        
        .notification-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            margin-left: 1rem;
        }
    `;
    document.head.appendChild(style);
}

// Initialize dynamic styles
addDynamicStyles();
