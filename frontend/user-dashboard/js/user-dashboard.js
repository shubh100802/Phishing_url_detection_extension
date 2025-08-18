// User Dashboard JavaScript
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
            description: 'Monitor your personal security status and activities'
        },
        scanner: {
            title: 'URL Scanner',
            description: 'Check any URL for potential phishing threats and security risks'
        },
        history: {
            title: 'Scan History',
            description: 'View your previous URL scans and results'
        },
        reports: {
            title: 'Security Reports',
            description: 'Generate and download security reports'
        },
        preferences: {
            title: 'User Preferences',
            description: 'Customize your security settings and preferences'
        }
    };

    if (sectionData[sectionName]) {
        pageTitle.textContent = sectionData[sectionName].title;
        pageDescription.textContent = sectionData[sectionName].description;
    }
}

// Load sample data for demonstration
function loadSampleData() {
    loadHistoryData();
}

// Load scan history data
function loadHistoryData() {
    const historyData = [
        {
            url: 'google.com',
            result: 'Safe',
            scanDate: '2025-01-15 14:30',
            threatLevel: 'None',
            status: 'safe'
        },
        {
            url: 'suspicious-site.net',
            result: 'Threat Detected',
            scanDate: '2025-01-14 16:45',
            threatLevel: 'Medium',
            status: 'threat'
        },
        {
            url: 'github.com',
            result: 'Safe',
            scanDate: '2025-01-13 09:20',
            threatLevel: 'None',
            status: 'safe'
        },
        {
            url: 'phishing-attempt.org',
            result: 'High Threat',
            scanDate: '2025-01-12 11:15',
            threatLevel: 'High',
            status: 'threat'
        },
        {
            url: 'stackoverflow.com',
            result: 'Safe',
            scanDate: '2025-01-11 15:30',
            threatLevel: 'None',
            status: 'safe'
        }
    ];

    const tableBody = document.getElementById('historyTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
        historyData.forEach(scan => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${scan.url}</td>
                <td><span class="scan-result ${scan.status}">${scan.result}</span></td>
                <td>${scan.scanDate}</td>
                <td><span class="threat-level ${scan.threatLevel.toLowerCase().replace(' ', '-')}">${scan.threatLevel}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="rescanURL('${scan.url}')">Rescan</button>
                    <button class="btn btn-sm btn-secondary" onclick="viewScanDetails('${scan.url}')">Details</button>
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
        const currentText = stat.textContent;
        if (currentText.includes('+')) {
            // Don't update stats that show changes
            return;
        }
        
        if (currentText.includes('h ago')) {
            const hours = parseInt(currentText.match(/\d+/)[0]);
            if (hours < 24) {
                stat.textContent = `${hours + 1}h ago`;
            }
        }
    });
}

// Quick action functions
function quickScan() {
    navigateToSection('scanner');
    document.getElementById('urlInput').focus();
}

function generateReport() {
    navigateToSection('reports');
    generateNewReport();
}

function viewHistory() {
    navigateToSection('history');
}

function updatePreferences() {
    navigateToSection('preferences');
}

// URL scanning functionality
function scanURL() {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();
    
    if (!url) {
        showNotification('Please enter a URL to scan', 'error');
        return;
    }

    if (!isValidURL(url)) {
        showNotification('Please enter a valid URL', 'error');
        return;
    }

    // Show scanning state
    const scanBtn = document.querySelector('.scan-btn');
    const originalText = scanBtn.innerHTML;
    scanBtn.innerHTML = `
        <div class="spinner"></div>
        Scanning...
    `;
    scanBtn.disabled = true;

    // Simulate scanning process
    setTimeout(() => {
        const deepScan = document.getElementById('deepScan').checked;
        const saveHistory = document.getElementById('saveHistory').checked;
        
        // Simulate scan results
        const scanResult = simulateScanResult(url);
        
        // Display results
        displayScanResults(scanResult);
        
        // Save to history if enabled
        if (saveHistory) {
            saveToHistory(url, scanResult);
        }
        
        // Reset button
        scanBtn.innerHTML = originalText;
        scanBtn.disabled = false;
        
        showNotification(`Scan completed for ${url}`, 'success');
    }, 2000 + (deepScan ? 1000 : 0));
}

// Simulate scan result
function simulateScanResult(url) {
    const random = Math.random();
    let result;
    
    if (random < 0.8) {
        result = {
            status: 'safe',
            threatLevel: 'None',
            description: 'No threats detected. This URL appears to be safe.',
            details: {
                ssl: 'Valid SSL certificate',
                domainAge: 'Domain registered for 5+ years',
                reputation: 'Good reputation score',
                blacklist: 'Not found in any blacklists'
            }
        };
    } else if (random < 0.95) {
        result = {
            status: 'suspicious',
            threatLevel: 'Low',
            description: 'Some suspicious elements detected. Proceed with caution.',
            details: {
                ssl: 'Valid SSL certificate',
                domainAge: 'Domain registered for 1-2 years',
                reputation: 'Moderate reputation score',
                blacklist: 'Not found in any blacklists'
            }
        };
    } else {
        result = {
            status: 'threat',
            threatLevel: 'High',
            description: 'High threat level detected. This URL may be malicious.',
            details: {
                ssl: 'Invalid or expired SSL certificate',
                domainAge: 'Recently registered domain',
                reputation: 'Poor reputation score',
                blacklist: 'Found in multiple blacklists'
            }
        };
    }
    
    return {
        url: url,
        timestamp: new Date().toLocaleString(),
        ...result
    };
}

// Display scan results
function displayScanResults(result) {
    const scanResults = document.getElementById('scanResults');
    const resultContent = document.getElementById('resultContent');
    
    const statusClass = result.status;
    const statusIcon = result.status === 'safe' ? '✅' : result.status === 'suspicious' ? '⚠️' : '🚨';
    
    resultContent.innerHTML = `
        <div class="result-summary ${statusClass}">
            <div class="result-header">
                <span class="result-icon">${statusIcon}</span>
                <div class="result-info">
                    <h4>${result.url}</h4>
                    <p class="result-description">${result.description}</p>
                    <span class="result-time">Scanned at: ${result.timestamp}</span>
                </div>
            </div>
            <div class="threat-level-badge ${result.threatLevel.toLowerCase().replace(' ', '-')}">
                Threat Level: ${result.threatLevel}
            </div>
        </div>
        <div class="result-details">
            <h5>Security Details:</h5>
            <ul>
                <li><strong>SSL Certificate:</strong> ${result.details.ssl}</li>
                <li><strong>Domain Age:</strong> ${result.details.domainAge}</li>
                <li><strong>Reputation Score:</strong> ${result.details.reputation}</li>
                <li><strong>Blacklist Status:</strong> ${result.details.blacklist}</li>
            </ul>
        </div>
        <div class="result-actions">
            <button class="btn btn-primary" onclick="saveToHistory('${result.url}', ${JSON.stringify(result).replace(/"/g, '&quot;')})">
                Save to History
            </button>
            <button class="btn btn-secondary" onclick="shareResult('${result.url}', '${result.status}')">
                Share Result
            </button>
        </div>
    `;
    
    scanResults.style.display = 'block';
    
    // Add dynamic styles for result display
    addResultStyles();
}

// Add styles for scan results
function addResultStyles() {
    if (!document.querySelector('#result-styles')) {
        const style = document.createElement('style');
        style.id = 'result-styles';
        style.textContent = `
            .result-summary {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding: 1.5rem;
                border-radius: 12px;
                margin-bottom: 1.5rem;
            }
            
            .result-summary.safe {
                background: #dcfce7;
                border: 1px solid #bbf7d0;
            }
            
            .result-summary.suspicious {
                background: #fef3c7;
                border: 1px solid #fde68a;
            }
            
            .result-summary.threat {
                background: #fee2e2;
                border: 1px solid #fecaca;
            }
            
            .result-header {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
            }
            
            .result-icon {
                font-size: 2rem;
            }
            
            .result-info h4 {
                font-size: 1.125rem;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 0.5rem;
            }
            
            .result-description {
                color: #374151;
                margin-bottom: 0.5rem;
            }
            
            .result-time {
                font-size: 0.875rem;
                color: #6b7280;
            }
            
            .threat-level-badge {
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.875rem;
                font-weight: 600;
                text-align: center;
            }
            
            .threat-level-badge.none {
                background: #dcfce7;
                color: #16a34a;
            }
            
            .threat-level-badge.low {
                background: #fef3c7;
                color: #d97706;
            }
            
            .threat-level-badge.high {
                background: #fee2e2;
                color: #dc2626;
            }
            
            .result-details {
                background: white;
                padding: 1.5rem;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
                margin-bottom: 1.5rem;
            }
            
            .result-details h5 {
                font-size: 1rem;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 1rem;
            }
            
            .result-details ul {
                list-style: none;
                padding: 0;
            }
            
            .result-details li {
                padding: 0.5rem 0;
                border-bottom: 1px solid #f1f5f9;
                display: flex;
                justify-content: space-between;
            }
            
            .result-details li:last-child {
                border-bottom: none;
            }
            
            .result-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
            }
            
            .spinner {
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Save scan to history
function saveToHistory(url, result) {
    // In a real application, this would save to localStorage or send to backend
    showNotification(`Scan result saved to history`, 'success');
    
    // Refresh history if we're on that page
    if (document.getElementById('history').classList.contains('active')) {
        loadHistoryData();
    }
}

// Share scan result
function shareResult(url, status) {
    const message = `I scanned ${url} using Rudraksha: The Saviour. Result: ${status}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'URL Scan Result',
            text: message,
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(message).then(() => {
            showNotification('Result copied to clipboard', 'success');
        });
    }
}

// Rescan URL
function rescanURL(url) {
    navigateToSection('scanner');
    document.getElementById('urlInput').value = url;
    scanURL();
}

// View scan details
function viewScanDetails(url) {
    showNotification(`Viewing details for: ${url}`, 'info');
    // In a real application, this would show a detailed modal
}

// Generate new report
function generateNewReport() {
    showNotification('Generating new report...', 'info');
    
    setTimeout(() => {
        showNotification('Report generated successfully!', 'success');
        // In a real application, this would create and download a report
    }, 2000);
}

// Download report
function downloadReport(type) {
    showNotification(`Downloading ${type} report...`, 'info');
    
    setTimeout(() => {
        showNotification(`${type} report downloaded successfully!`, 'success');
        // In a real application, this would trigger a file download
    }, 1500);
}

// Save preferences
function savePreferences() {
    const defaultScanDepth = document.getElementById('defaultScanDepth').value;
    const autoSaveHistory = document.getElementById('autoSaveHistory').checked;
    const showNotifications = document.getElementById('showNotifications').checked;
    const threatAlertLevel = document.getElementById('threatAlertLevel').value;
    const emailAlerts = document.getElementById('emailAlerts').checked;
    const autoBlockSuspicious = document.getElementById('autoBlockSuspicious').checked;
    const theme = document.getElementById('theme').value;
    const language = document.getElementById('language').value;

    // Simulate saving preferences
    showNotification('Preferences saved successfully', 'success');
    
    // Log preferences to console for demonstration
    console.log('Preferences saved:', {
        defaultScanDepth,
        autoSaveHistory,
        showNotifications,
        threatAlertLevel,
        emailAlerts,
        autoBlockSuspicious,
        theme,
        language
    });
}

// Utility functions
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

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
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#0ea5e9'};
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
            window.location.href = '../userlogin.html';
        }, 1000);
    }
}

// Add CSS for scan results and statuses
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .scan-result.safe {
            background: #dcfce7;
            color: #16a34a;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .scan-result.threat {
            background: #fee2e2;
            color: #dc2626;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .scan-result.suspicious {
            background: #fef3c7;
            color: #d97706;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .threat-level.none {
            background: #dcfce7;
            color: #16a34a;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .threat-level.low {
            background: #fef3c7;
            color: #d97706;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .threat-level.medium {
            background: #fef3c7;
            color: #d97706;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .threat-level.high {
            background: #fee2e2;
            color: #dc2626;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .btn-sm {
            padding: 0.5rem 1rem;
            font-size: 0.75rem;
            margin-right: 0.5rem;
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
