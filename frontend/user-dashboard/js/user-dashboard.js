document.addEventListener('DOMContentLoaded', async function () {
  ensureAuthenticated();
  applyUserHeader();
  initializeDashboard();
  loadPreferences();
  await loadDashboardData();
});

const API_BASES = [
  `http://localhost:${Number(location.search.match(/port=(\d+)/)?.[1]) || 3001}`,
  'http://localhost:3000',
];

let fullHistory = [];

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function ensureAuthenticated() {
  const user = getCurrentUser();
  const token = localStorage.getItem('accessToken');
  if (!user || !token) window.location.href = '../userlogin.html';
}

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('accessToken') || '';
  const headers = Object.assign(
    { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    options.headers || {}
  );

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
        setTimeout(() => (window.location.href = '../userlogin.html'), 500);
      }
      return res;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Network error');
}

function applyUserHeader() {
  const user = getCurrentUser();
  if (!user) return;
  const nameEl = document.querySelector('.user-details .user-name');
  const roleEl = document.querySelector('.user-details .user-role');
  if (nameEl) nameEl.textContent = user.name || user.email || 'User';
  if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Administrator' : 'Standard User';
}

function initializeDashboard() {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => navigateToSection(item.getAttribute('data-section')));
  });

  document.getElementById('statusFilter')?.addEventListener('change', renderHistoryTable);
  document.getElementById('dateFilter')?.addEventListener('change', renderHistoryTable);

  setInterval(refreshStats, 30000);
}

function navigateToSection(sectionName) {
  document.querySelectorAll('.content-section').forEach((section) => section.classList.remove('active'));
  document.getElementById(sectionName)?.classList.add('active');

  document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
  document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');

  updatePageHeader(sectionName);
  if (sectionName === 'history') renderHistoryTable();
}

function updatePageHeader(sectionName) {
  const pageTitle = document.getElementById('pageTitle');
  const pageDescription = document.getElementById('pageDescription');

  const sectionData = {
    overview: ['Dashboard Overview', 'Monitor your personal security status and activities'],
    scanner: ['URL Scanner', 'Check any URL for potential phishing threats and security risks'],
    history: ['Scan History', 'View your previous URL scans and results'],
    reports: ['Security Reports', 'Generate and download security reports'],
    preferences: ['User Preferences', 'Customize your security settings and preferences'],
  };

  if (sectionData[sectionName]) {
    pageTitle.textContent = sectionData[sectionName][0];
    pageDescription.textContent = sectionData[sectionName][1];
  }
}

async function loadDashboardData() {
  await Promise.all([loadStatsData(), loadHistoryData()]);
}

async function loadStatsData() {
  try {
    const res = await apiFetch('/api/scan/stats');
    if (!res.ok) throw new Error('Failed to load stats');
    const data = await res.json();

    const numbers = document.querySelectorAll('#overview .stat-card .stat-number');
    const total = Number(data.totalScans || 0);
    const safe = Number(data.safeScans || 0);
    const suspicious = Number(data.suspiciousScans || 0);
    const malicious = Number(data.maliciousScans || 0);
    const threats = suspicious + malicious;
    const successRate = total > 0 ? ((safe / total) * 100).toFixed(1) : '0.0';

    if (numbers[0]) numbers[0].textContent = String(total);
    if (numbers[1]) numbers[1].textContent = String(threats);
    if (numbers[2]) numbers[2].textContent = String(safe);
    if (numbers[3]) numbers[3].textContent = data.lastScan?.createdAt ? formatElapsed(new Date(data.lastScan.createdAt)) : 'N/A';

    const changes = document.querySelectorAll('#overview .stat-card .stat-change');
    if (changes[0]) changes[0].textContent = `${Math.max(0, total - threats)} likely clean scans`;
    if (changes[1]) changes[1].textContent = threats ? 'Recent alerts detected' : 'No recent alerts';
    if (changes[2]) changes[2].textContent = `${successRate}% success rate`;
    if (changes[3]) changes[3].textContent = data.lastScan?.url || 'No scan yet';
  } catch {
    showNotification('Unable to fetch latest stats', 'error');
  }
}

async function loadHistoryData() {
  const tableBody = document.getElementById('historyTableBody');
  if (!tableBody) return;
  tableBody.innerHTML = '<tr><td colspan="5">Loading history...</td></tr>';

  try {
    const res = await apiFetch('/api/scan/history?limit=100');
    if (!res.ok) throw new Error('Failed to load history');
    const data = await res.json();
    fullHistory = Array.isArray(data.items) ? data.items : [];
    renderHistoryTable();
    renderRecentScans(fullHistory.slice(0, 3));
    updateReportsSection();
  } catch {
    tableBody.innerHTML = '<tr><td colspan="5">Error loading history</td></tr>';
    showNotification('Unable to fetch scan history', 'error');
  }
}

function updateReportsSection() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();

  const monthly = fullHistory.filter((x) => new Date(x.createdAt || x.timestamp || Date.now()).getTime() >= monthStart);
  const weekly = fullHistory.filter((x) => new Date(x.createdAt || x.timestamp || Date.now()).getTime() >= weekStart);

  const monthlyTotal = monthly.length;
  const monthlySafe = monthly.filter((x) => x.verdict === 'safe').length;
  const monthlyThreats = monthlyTotal - monthlySafe;
  const monthlySuccess = monthlyTotal ? ((monthlySafe / monthlyTotal) * 100).toFixed(1) : '0.0';

  const weeklyThreats = weekly.filter((x) => x.verdict !== 'safe').length;
  const freq = {};
  weekly.forEach((x) => {
    const u = String(x.url || '');
    if (!u) return;
    freq[u] = (freq[u] || 0) + 1;
  });
  const mostScanned = Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0] || 'N/A';

  setText('monthlyReportDate', now.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
  setText('monthlyTotalScans', String(monthlyTotal));
  setText('monthlyThreats', String(monthlyThreats));
  setText('monthlySuccessRate', `${monthlySuccess}%`);

  setText('weeklyReportDate', `Last 7 days`);
  setText('weeklyScans', String(weekly.length));
  setText('weeklyThreats', String(weeklyThreats));
  setText('weeklyMostScanned', mostScanned);
}

function getFilteredHistory() {
  const status = (document.getElementById('statusFilter')?.value || 'all').toLowerCase();
  const dateWindow = (document.getElementById('dateFilter')?.value || '30').toLowerCase();
  const now = Date.now();

  return fullHistory.filter((scan) => {
    const verdict = String(scan.verdict || 'safe').toLowerCase();
    const created = new Date(scan.createdAt || scan.timestamp || Date.now()).getTime();

    if (status === 'safe' && verdict !== 'safe') return false;
    if (status === 'suspicious' && verdict !== 'suspicious') return false;
    if (status === 'threat' && verdict === 'safe') return false;

    if (dateWindow !== 'all') {
      const days = Number(dateWindow) || 30;
      if (created < now - days * 24 * 60 * 60 * 1000) return false;
    }

    return true;
  });
}

function renderHistoryTable() {
  const tableBody = document.getElementById('historyTableBody');
  if (!tableBody) return;

  const items = getFilteredHistory();
  tableBody.innerHTML = '';
  if (!items.length) {
    tableBody.innerHTML = '<tr><td colspan="5">No scans matching filters</td></tr>';
    return;
  }

  items.forEach((scan) => {
    const verdict = String(scan.verdict || 'safe').toLowerCase();
    const statusClass = verdict === 'malicious' ? 'threat' : verdict;
    const threatLevel = verdict === 'malicious' ? 'High' : verdict === 'suspicious' ? 'Medium' : 'None';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(scan.url || '')}</td>
      <td><span class="scan-result ${statusClass}">${capitalize(verdict)}</span></td>
      <td>${new Date(scan.createdAt || scan.timestamp || Date.now()).toLocaleString()}</td>
      <td><span class="threat-level ${threatLevel.toLowerCase()}">${threatLevel}</span></td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="rescanURL('${escapeAttr(scan.url || '')}')">Rescan</button>
        <button class="btn btn-sm btn-secondary" onclick="viewScanDetails('${escapeAttr(scan.url || '')}')">Details</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function renderRecentScans(items) {
  const scansList = document.querySelector('#overview .scans-list');
  if (!scansList) return;
  scansList.innerHTML = '';

  if (!items.length) {
    scansList.innerHTML = '<div class="scan-item safe"><div class="scan-content"><h4>No scans yet</h4></div></div>';
    return;
  }

  items.forEach((scan) => {
    const verdict = String(scan.verdict || 'safe').toLowerCase();
    const itemClass = verdict === 'safe' ? 'safe' : 'threat';
    const icon = verdict === 'safe' ? 'OK' : '!';
    const details = verdict === 'safe' ? 'No threats detected' : `Risk score ${scan.riskScore ?? 'N/A'}`;
    const time = formatElapsed(new Date(scan.createdAt || scan.timestamp || Date.now()));
    const el = document.createElement('div');
    el.className = `scan-item ${itemClass}`;
    el.innerHTML = `
      <div class="scan-icon">${icon}</div>
      <div class="scan-content">
        <h4>${escapeHtml(scan.url || '')}</h4>
        <p>${escapeHtml(capitalize(verdict))} - ${escapeHtml(details)}</p>
        <span class="scan-time">${escapeHtml(time)}</span>
      </div>
    `;
    scansList.appendChild(el);
  });
}

function refreshStats() {
  loadStatsData();
}

function quickScan() {
  navigateToSection('scanner');
  document.getElementById('urlInput')?.focus();
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

async function scanURL() {
  const urlInput = document.getElementById('urlInput');
  const url = urlInput?.value?.trim();
  if (!url) return showNotification('Please enter a URL to scan', 'error');
  if (!isValidURL(url)) return showNotification('Please enter a valid URL', 'error');

  const deepScan = document.getElementById('deepScan')?.checked;
  const saveHistory = document.getElementById('saveHistory')?.checked;
  const scanBtn = document.querySelector('.scan-btn');
  const originalText = scanBtn.innerHTML;
  scanBtn.innerHTML = '<div class="spinner"></div> Scanning...';
  scanBtn.disabled = true;

  try {
    const res = await apiFetch('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ url, deepScan, saveHistory }),
    });
    if (!res.ok) throw new Error('Scan failed');
    const result = await res.json();
    displayScanResults(result);
    if (saveHistory) await Promise.all([loadHistoryData(), loadStatsData()]);
    showNotification(`Scan completed for ${url}`, 'success');
  } catch {
    showNotification('Scan failed. Please try again.', 'error');
  } finally {
    scanBtn.innerHTML = originalText;
    scanBtn.disabled = false;
  }
}

function displayScanResults(result) {
  const scanResults = document.getElementById('scanResults');
  const resultContent = document.getElementById('resultContent');
  if (!scanResults || !resultContent) return;

  const verdict = String(result.verdict || 'safe').toLowerCase();
  const statusClass = verdict === 'malicious' ? 'threat' : verdict;
  const icon = verdict === 'safe' ? 'OK' : verdict === 'suspicious' ? '!' : '!!';
  const threatLevel = verdict === 'malicious' ? 'High' : verdict === 'suspicious' ? 'Medium' : 'None';

  resultContent.innerHTML = `
    <div class="result-summary ${statusClass}">
      <div class="result-header">
        <span class="result-icon">${icon}</span>
        <div class="result-info">
          <h4>${escapeHtml(result.url || '')}</h4>
          <p class="result-description">${escapeHtml(capitalize(verdict))} verdict from heuristic analysis</p>
          <span class="result-time">Scanned at: ${new Date(result.timestamp || Date.now()).toLocaleString()}</span>
        </div>
      </div>
      <div class="threat-level-badge ${threatLevel.toLowerCase()}">Threat Level: ${threatLevel}</div>
    </div>
    <div class="result-details">
      <h5>Security Details:</h5>
      <ul>
        <li><strong>Verdict:</strong> ${escapeHtml(capitalize(verdict))}</li>
        <li><strong>Risk Score:</strong> ${escapeHtml(String(result.riskScore ?? 'N/A'))}</li>
        <li><strong>Source:</strong> ${escapeHtml((result.sources && result.sources[0]?.name) || 'Heuristic')}</li>
      </ul>
    </div>
  `;

  scanResults.style.display = 'block';
  addResultStyles();
}

function addResultStyles() {
  if (document.querySelector('#result-styles')) return;
  const style = document.createElement('style');
  style.id = 'result-styles';
  style.textContent = `
    .result-summary { display:flex; justify-content:space-between; align-items:flex-start; padding:1.5rem; border-radius:12px; margin-bottom:1.5rem; }
    .result-summary.safe { background:#dcfce7; border:1px solid #bbf7d0; }
    .result-summary.suspicious { background:#fef3c7; border:1px solid #fde68a; }
    .result-summary.threat { background:#fee2e2; border:1px solid #fecaca; }
    .result-header { display:flex; align-items:flex-start; gap:1rem; }
    .result-icon { font-size:2rem; }
    .result-info h4 { font-size:1.125rem; font-weight:600; color:#1e293b; margin-bottom:.5rem; }
    .result-description { color:#374151; margin-bottom:.5rem; }
    .result-time { font-size:.875rem; color:#6b7280; }
    .threat-level-badge { padding:.5rem 1rem; border-radius:20px; font-size:.875rem; font-weight:600; text-align:center; }
    .threat-level-badge.none { background:#dcfce7; color:#16a34a; }
    .threat-level-badge.medium { background:#fef3c7; color:#d97706; }
    .threat-level-badge.high { background:#fee2e2; color:#dc2626; }
    .result-details { background:white; padding:1.5rem; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:1.5rem; }
    .result-details h5 { font-size:1rem; font-weight:600; color:#1e293b; margin-bottom:1rem; }
    .result-details ul { list-style:none; padding:0; }
    .result-details li { padding:.5rem 0; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; }
    .result-details li:last-child { border-bottom:none; }
    .spinner { width:20px; height:20px; border:2px solid rgba(255,255,255,.3); border-top:2px solid white; border-radius:50%; animation:spin 1s linear infinite; }
    @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  `;
  document.head.appendChild(style);
}

function saveToHistory() {
  loadHistoryData();
}

function shareResult(url, status) {
  const message = `I scanned ${url} using RUDRAKSHA. Result: ${status}`;
  if (navigator.share) {
    navigator.share({ title: 'URL Scan Result', text: message, url: window.location.href });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(message).then(() => showNotification('Result copied to clipboard', 'success'));
  }
}

function rescanURL(url) {
  navigateToSection('scanner');
  const input = document.getElementById('urlInput');
  if (input) input.value = url;
  scanURL();
}

function viewScanDetails(url) {
  const entry = fullHistory.find((x) => String(x.url) === String(url));
  if (!entry) return showNotification(`No details found for ${url}`, 'info');
  const when = new Date(entry.createdAt || entry.timestamp || Date.now()).toLocaleString();
  showNotification(`${entry.verdict.toUpperCase()} | risk ${entry.riskScore} | ${when}`, 'info');
}

async function generateNewReport() {
  showNotification('Generating report...', 'info');
  try {
    if (!fullHistory.length) await loadHistoryData();
    const items = getFilteredHistory();
    const safe = items.filter((x) => x.verdict === 'safe').length;
    const suspicious = items.filter((x) => x.verdict === 'suspicious').length;
    const malicious = items.filter((x) => x.verdict === 'malicious').length;
    showNotification(
      `Report: total=${items.length}, safe=${safe}, suspicious=${suspicious}, malicious=${malicious}`,
      'success'
    );
  } catch {
    showNotification('Could not generate report', 'error');
  }
}

function downloadReport(type) {
  const items = getFilteredHistory();
  if (!items.length) return showNotification('No history to export', 'error');

  const rows = [['URL', 'Verdict', 'RiskScore', 'CreatedAt']].concat(
    items.map((x) => [x.url, x.verdict, x.riskScore, new Date(x.createdAt || x.timestamp || Date.now()).toISOString()])
  );
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const fileName = `RUDRAKSHA-${type || 'report'}-${new Date().toISOString().slice(0, 10)}.csv`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showNotification('Report CSV downloaded', 'success');
}

function savePreferences() {
  const data = {
    defaultScanDepth: document.getElementById('defaultScanDepth')?.value,
    autoSaveHistory: document.getElementById('autoSaveHistory')?.checked,
    showNotifications: document.getElementById('showNotifications')?.checked,
    threatAlertLevel: document.getElementById('threatAlertLevel')?.value,
    emailAlerts: document.getElementById('emailAlerts')?.checked,
    autoBlockSuspicious: document.getElementById('autoBlockSuspicious')?.checked,
    theme: document.getElementById('theme')?.value,
    language: document.getElementById('language')?.value,
  };

  try {
    localStorage.setItem('userPreferences', JSON.stringify(data));
    showNotification('Preferences saved successfully', 'success');
  } catch {
    showNotification('Could not save preferences', 'error');
  }
}

function loadPreferences() {
  try {
    const raw = localStorage.getItem('userPreferences');
    if (!raw) return;
    const p = JSON.parse(raw);
    setValue('defaultScanDepth', p.defaultScanDepth);
    setChecked('autoSaveHistory', p.autoSaveHistory);
    setChecked('showNotifications', p.showNotifications);
    setValue('threatAlertLevel', p.threatAlertLevel);
    setChecked('emailAlerts', p.emailAlerts);
    setChecked('autoBlockSuspicious', p.autoBlockSuspicious);
    setValue('theme', p.theme);
    setValue('language', p.language);
  } catch {
    // ignore invalid stored prefs
  }
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el && value != null) el.value = value;
}

function setChecked(id, value) {
  const el = document.getElementById(id);
  if (el && typeof value === 'boolean') el.checked = value;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${escapeHtml(message)}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
    </div>
  `;
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#0ea5e9'};
    color: white; padding: 1rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,.15);
    z-index: 10000; max-width: 420px; animation: slideInRight .3s ease-out;
  `;

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

  document.body.appendChild(notification);
  setTimeout(() => notification.parentElement && notification.remove(), 5000);
}

function logout() {
  if (!confirm('Are you sure you want to logout?')) return;
  showNotification('Logging out...', 'info');
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_remember');
  } catch {}
  setTimeout(() => (window.location.href = '../userlogin.html'), 500);
}

function formatElapsed(date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function capitalize(v) {
  const s = String(v || '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(text) {
  return String(text || '').replace(/'/g, "\\'");
}

function addDynamicStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .scan-result.safe { background:#dcfce7; color:#16a34a; padding:.25rem .75rem; border-radius:20px; font-size:.75rem; font-weight:600; }
    .scan-result.threat { background:#fee2e2; color:#dc2626; padding:.25rem .75rem; border-radius:20px; font-size:.75rem; font-weight:600; }
    .scan-result.suspicious { background:#fef3c7; color:#d97706; padding:.25rem .75rem; border-radius:20px; font-size:.75rem; font-weight:600; }
    .threat-level.none { background:#dcfce7; color:#16a34a; padding:.25rem .75rem; border-radius:20px; font-size:.75rem; font-weight:600; }
    .threat-level.medium, .threat-level.low { background:#fef3c7; color:#d97706; padding:.25rem .75rem; border-radius:20px; font-size:.75rem; font-weight:600; }
    .threat-level.high { background:#fee2e2; color:#dc2626; padding:.25rem .75rem; border-radius:20px; font-size:.75rem; font-weight:600; }
    .btn-sm { padding:.5rem 1rem; font-size:.75rem; margin-right:.5rem; }
    .notification-content { display:flex; justify-content:space-between; align-items:center; gap:.75rem; }
    .notification-close { background:none; border:none; color:white; font-size:1.25rem; cursor:pointer; }
  `;
  document.head.appendChild(style);
}

addDynamicStyles();
