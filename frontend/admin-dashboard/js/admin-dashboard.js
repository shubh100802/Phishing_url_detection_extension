// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadSampleData();
});

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

// Load sample data for demonstration
function loadSampleData() {
    loadThreatsData();
    loadUsersData();
}

// Load threats data
function loadThreatsData() {
    const threatsData = [
        {
            url: 'malicious-site.com',
            threatLevel: 'High',
            detectionDate: '2025-01-15 14:32',
            status: 'Blocked'
        },
        {
            url: 'phishing-attempt.net',
            threatLevel: 'Medium',
            detectionDate: '2025-01-15 13:45',
            status: 'Under Review'
        },
        {
            url: 'fake-bank-login.org',
            threatLevel: 'High',
            detectionDate: '2025-01-15 12:18',
            status: 'Blocked'
        },
        {
            url: 'suspicious-link.xyz',
            threatLevel: 'Low',
            detectionDate: '2025-01-15 11:30',
            status: 'Monitored'
        }
    ];

    const tableBody = document.getElementById('threatsTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
        threatsData.forEach(threat => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${threat.url}</td>
                <td><span class="threat-level ${threat.threatLevel.toLowerCase()}">${threat.threatLevel}</span></td>
                <td>${threat.detectionDate}</td>
                <td><span class="status ${threat.status.toLowerCase().replace(' ', '-')}">${threat.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewThreatDetails('${threat.url}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="updateThreatStatus('${threat.url}')">Update</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

// Load users data
function loadUsersData() {
    const usersData = [
        {
            name: 'Priya Patel',
            email: 'priya.patel@company.com',
            role: 'User',
            status: 'Active',
            lastLogin: '2025-01-15 14:20'
        },
        {
            name: 'Rajesh Kumar',
            email: 'rajesh.kumar@company.com',
            role: 'User',
            status: 'Active',
            lastLogin: '2025-01-15 13:45'
        },
        {
            name: 'Meera Singh',
            email: 'meera.singh@company.com',
            role: 'Moderator',
            status: 'Active',
            lastLogin: '2025-01-15 12:30'
        },
        {
            name: 'Vikram Malhotra',
            email: 'vikram.malhotra@company.com',
            role: 'User',
            status: 'Inactive',
            lastLogin: '2025-01-15 09:15'
        }
    ];

    const tableBody = document.getElementById('usersTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
        usersData.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="role ${user.role.toLowerCase()}">${user.role}</span></td>
                <td><span class="status ${user.status.toLowerCase()}">${user.status}</span></td>
                <td>${user.lastLogin}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editUser('${user.email}')">Edit</button>
                    <button class="btn btn-sm btn-secondary" onclick="viewUserDetails('${user.email}')">View</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

// Refresh dashboard stats
function refreshStats() {
    // Simulate real-time updates
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const currentValue = parseInt(stat.textContent.replace(/,/g, ''));
        const randomChange = Math.floor(Math.random() * 10) + 1;
        const newValue = currentValue + randomChange;
        stat.textContent = newValue.toLocaleString();
    });

    // Update activity times
    const activityTimes = document.querySelectorAll('.activity-time');
    activityTimes.forEach(timeElement => {
        const currentText = timeElement.textContent;
        if (currentText.includes('minutes ago')) {
            const minutes = parseInt(currentText.match(/\d+/)[0]);
            if (minutes < 60) {
                timeElement.textContent = `${minutes + 1} minutes ago`;
            }
        }
    });
}

// Threat management functions
function scanNewURL() {
    const url = prompt('Enter URL to scan:');
    if (url) {
        // Simulate URL scanning
        showNotification('Scanning URL: ' + url, 'info');
        setTimeout(() => {
            showNotification('URL scan completed. No threats detected.', 'success');
        }, 2000);
    }
}

function viewThreatDetails(url) {
    showNotification(`Viewing details for: ${url}`, 'info');
    // In a real application, this would open a detailed modal
}

function updateThreatStatus(url) {
    const newStatus = prompt(`Update status for ${url} (Blocked/Under Review/Monitored):`);
    if (newStatus) {
        showNotification(`Status updated for ${url} to: ${newStatus}`, 'success');
        // Refresh the threats table
        loadThreatsData();
    }
}

// User management functions
function addNewUser() {
    const name = prompt('Enter user name:');
    const email = prompt('Enter user email:');
    const role = prompt('Enter user role (User/Moderator/Admin):');
    
    if (name && email && role) {
        showNotification(`User ${name} added successfully`, 'success');
        // Refresh the users table
        loadUsersData();
    }
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
    if (confirm('Are you sure you want to logout?')) {
        showNotification('Logging out...', 'info');
        setTimeout(() => {
            window.location.href = '../adminlogin.html';
        }, 1000);
    }
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
