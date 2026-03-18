document.addEventListener('DOMContentLoaded', function () {
  ensureAuthenticated();
  applyAdminHeader();
  initializeDashboard();
  initializeModals();
  loadOverview();
  loadThreatsData();
  loadUsersData();
});

const API_BASES = [
  `http://localhost:${Number(location.search.match(/port=(\d+)/)?.[1]) || 3001}`,
  'http://localhost:3000',
];

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
  if (!user || !token || user.role !== 'admin') window.location.href = '../adminlogin.html';
}

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('accessToken') || '';
  const headers = Object.assign({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, options.headers || {});
  let lastErr;
  for (const base of API_BASES) {
    try {
      const res = await fetch(base + path, Object.assign({}, options, { headers }));
      if (res.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('currentUser');
        showNotification('Session expired. Please log in again.', 'error');
        setTimeout(() => (window.location.href = '../adminlogin.html'), 500);
      }
      return res;
    } catch (e) {
      lastErr = e;
    }
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

function initializeDashboard() {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => navigateToSection(item.getAttribute('data-section')));
  });
  document.getElementById('dateRange')?.addEventListener('change', loadAnalyticsCharts);
  setInterval(() => {
    loadOverview(true);
    if (document.getElementById('analytics')?.classList.contains('active')) loadAnalyticsCharts();
  }, 30000);
}

function navigateToSection(sectionName) {
  document.querySelectorAll('.content-section').forEach((s) => s.classList.remove('active'));
  document.getElementById(sectionName)?.classList.add('active');

  document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
  document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');

  updatePageHeader(sectionName);
  if (sectionName === 'overview') loadOverview();
  if (sectionName === 'threats') loadThreatsData();
  if (sectionName === 'users') loadUsersData();
  if (sectionName === 'analytics') loadAnalyticsCharts();
}

function updatePageHeader(sectionName) {
  const pageTitle = document.getElementById('pageTitle');
  const pageDescription = document.getElementById('pageDescription');
  const map = {
    overview: ['Dashboard Overview', 'Monitor system status and recent activities'],
    threats: ['Threat Management', 'Monitor and manage detected threats'],
    analytics: ['Analytics & Reports', 'Threat and scan trends over time'],
    users: ['User Management', 'Manage user accounts and permissions'],
    settings: ['System Settings', 'Configure system parameters and preferences'],
  };
  if (map[sectionName]) {
    pageTitle.textContent = map[sectionName][0];
    pageDescription.textContent = map[sectionName][1];
  }
}

function initializeModals() {
  const scanModal = document.getElementById('scanModal');
  const scanForm = document.getElementById('scanForm');
  document.getElementById('scanCancelBtn')?.addEventListener('click', () => (scanModal.style.display = 'none'));
  scanForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('scanUrlInput').value.trim();
    const deepScan = document.getElementById('scanDeepInput').checked;
    const saveHistory = document.getElementById('scanSaveInput').checked;
    if (!url) return;
    try {
      const res = await apiFetch('/api/scan', { method: 'POST', body: JSON.stringify({ url, deepScan, saveHistory }) });
      if (!res.ok) throw new Error('Scan failed');
      const data = await res.json();
      showNotification(`Scan complete: ${data.verdict.toUpperCase()} (${data.riskScore})`, 'success');
      scanModal.style.display = 'none';
      loadThreatsData();
      loadOverview(true);
    } catch {
      showNotification('URL scan failed', 'error');
    }
  });

  const threatModal = document.getElementById('threatModal');
  const threatForm = document.getElementById('threatForm');
  document.getElementById('threatCancelBtn')?.addEventListener('click', () => (threatModal.style.display = 'none'));
  threatForm?.addEventListener('submit', async (e) => {
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
      threatModal.style.display = 'none';
      loadThreatsData();
      loadOverview(true);
    } catch {
      showNotification('Failed to update threat', 'error');
    }
  });

  const userModal = document.getElementById('userModal');
  const userForm = document.getElementById('userForm');
  document.getElementById('userCancelBtn')?.addEventListener('click', () => (userModal.style.display = 'none'));
  userForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('userIdInput').value;
    const name = document.getElementById('userNameInput').value.trim();
    const email = document.getElementById('userEmailInput').value.trim();
    const role = document.getElementById('userRoleInput').value;
    const status = document.getElementById('userStatusInput').value;
    const password = document.getElementById('userPasswordInput').value.trim();
    if (!name || !role) return showNotification('Name and role are required', 'error');
    try {
      if (id) {
        const res = await apiFetch(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify({ name, role, status }) });
        if (!res.ok) throw new Error('Update user failed');
        showNotification('User updated successfully', 'success');
      } else {
        if (!email) return showNotification('Email is required', 'error');
        if (!password || password.length < 6) return showNotification('Password must be at least 6 chars', 'error');
        const res = await apiFetch('/api/users', { method: 'POST', body: JSON.stringify({ name, email, role, password }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Create user failed');
        showNotification(`User ${name} created successfully`, 'success');
      }
      userModal.style.display = 'none';
      userForm.reset();
      loadUsersData();
      loadOverview(true);
    } catch (err) {
      showNotification(err.message || 'Failed to save user', 'error');
    }
  });
}

async function loadOverview(isRefresh = false) {
  try {
    const res = await apiFetch('/api/analytics');
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    const s = data.stats || {};
    const numbers = document.querySelectorAll('#overview .stat-card .stat-number');
    if (numbers[0]) numbers[0].textContent = Number(s.totalThreats || 0).toLocaleString();
    if (numbers[1]) numbers[1].textContent = Number(s.blockedThreats || 0).toLocaleString();
    if (numbers[2]) numbers[2].textContent = Number(s.activeUsers || 0).toLocaleString();
    if (numbers[3]) numbers[3].textContent = `${s.uptimePercent ?? 99.9}%`;

    const list = document.querySelector('#overview .activity-list');
    if (list) {
      list.innerHTML = '';
      const items = Array.isArray(data.activities) ? data.activities : [];
      if (!items.length) {
        list.innerHTML = '<div class="activity-item"><div class="activity-content"><p>No recent activity</p></div></div>';
      } else {
        items.forEach((a) => {
          const icon = a.type === 'threat' ? '!' : a.type === 'scan' ? 'S' : 'i';
          const time = a.time ? new Date(a.time).toLocaleString() : '';
          const el = document.createElement('div');
          el.className = 'activity-item';
          el.innerHTML = `
            <div class="activity-icon ${a.type}">${icon}</div>
            <div class="activity-content">
              <h4>${escapeHtml(a.title || '')}</h4>
              <p>${escapeHtml(a.message || '')}</p>
              <span class="activity-time">${time}</span>
            </div>
          `;
          list.appendChild(el);
        });
      }
    }
  } catch {
    if (!isRefresh) showNotification('Failed to load overview', 'error');
  }
}

async function loadThreatsData() {
  const body = document.getElementById('threatsTableBody');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="5">Loading threats...</td></tr>';
  try {
    const res = await apiFetch('/api/threats?limit=100');
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    body.innerHTML = '';
    items.forEach((threat) => {
      const level = (threat.level || '').toLowerCase();
      const status = (threat.status || '').toLowerCase();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(threat.url || '')}</td>
        <td><span class="threat-level ${level}">${capitalize(level)}</span></td>
        <td>${new Date(threat.detectedAt || threat.createdAt || Date.now()).toLocaleString()}</td>
        <td><span class="status ${status}">${capitalize(status)}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewThreatDetails('${threat._id || ''}')">View</button>
          <button class="btn btn-sm btn-secondary" onclick="updateThreatStatus('${threat._id || ''}')">Update</button>
        </td>
      `;
      body.appendChild(row);
    });
    if (!items.length) body.innerHTML = '<tr><td colspan="5">No threats found</td></tr>';
  } catch {
    body.innerHTML = '<tr><td colspan="5">Error loading threats</td></tr>';
    showNotification('Failed to load threats', 'error');
  }
}

async function loadUsersData() {
  const body = document.getElementById('usersTableBody');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="6">Loading users...</td></tr>';
  try {
    const res = await apiFetch('/api/users?limit=200');
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    body.innerHTML = '';
    items.forEach((user) => {
      const role = (user.role || '').toLowerCase();
      const status = (user.status || '').toLowerCase();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(user.name || '')}</td>
        <td>${escapeHtml(user.email || '')}</td>
        <td><span class="role ${role}">${capitalize(role)}</span></td>
        <td><span class="status ${status}">${capitalize(status)}</span></td>
        <td>${user.updatedAt ? new Date(user.updatedAt).toLocaleString() : ''}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editUser('${user._id}')">Edit</button>
          <button class="btn btn-sm btn-secondary" onclick="viewUserDetails('${user._id}')">View</button>
        </td>
      `;
      body.appendChild(row);
    });
    if (!items.length) body.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
  } catch {
    body.innerHTML = '<tr><td colspan="6">Error loading users</td></tr>';
    showNotification('Failed to load users', 'error');
  }
}

async function loadAnalyticsCharts() {
  const days = document.getElementById('dateRange')?.value || '30';
  try {
    const res = await apiFetch(`/api/analytics/trends?days=${days}`);
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    drawTrendChart(document.getElementById('trendChart'), data.series || []);
    drawLevelChart(document.getElementById('levelChart'), data.levelCounts || { low: 0, medium: 0, high: 0 });
  } catch {
    showNotification('Failed to load analytics charts', 'error');
  }
}

function drawTrendChart(canvas, series) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 500;
  const h = canvas.height = canvas.height || 220;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0f172a';
  ctx.font = '12px Inter, sans-serif';
  if (!series.length) {
    ctx.fillText('No trend data', 16, 20);
    return;
  }
  const maxY = Math.max(1, ...series.map((d) => Math.max(d.scans, d.threats)));
  const pad = 24;
  const plotW = w - pad * 2;
  const plotH = h - pad * 2;

  function drawLine(values, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach((v, i) => {
      const x = pad + (i / Math.max(1, values.length - 1)) * plotW;
      const y = pad + plotH - (v / maxY) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  drawLine(series.map((d) => d.scans), '#2563eb');
  drawLine(series.map((d) => d.threats), '#dc2626');
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(pad, h - 12, 10, 3);
  ctx.fillStyle = '#111827';
  ctx.fillText('Scans', pad + 14, h - 8);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(pad + 70, h - 12, 10, 3);
  ctx.fillStyle = '#111827';
  ctx.fillText('Threats', pad + 84, h - 8);
}

function drawLevelChart(canvas, levels) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 500;
  const h = canvas.height = canvas.height || 220;
  ctx.clearRect(0, 0, w, h);
  const data = [
    { label: 'Low', value: levels.low || 0, color: '#16a34a' },
    { label: 'Medium', value: levels.medium || 0, color: '#d97706' },
    { label: 'High', value: levels.high || 0, color: '#dc2626' },
  ];
  const max = Math.max(1, ...data.map((d) => d.value));
  const pad = 32;
  const barW = 80;
  data.forEach((d, i) => {
    const x = pad + i * (barW + 40);
    const bh = (d.value / max) * (h - 70);
    const y = h - 30 - bh;
    ctx.fillStyle = d.color;
    ctx.fillRect(x, y, barW, bh);
    ctx.fillStyle = '#111827';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(`${d.label} (${d.value})`, x, h - 10);
  });
}

function refreshStats() {
  loadOverview(true);
}

function scanNewURL() {
  document.getElementById('scanUrlInput').value = '';
  document.getElementById('scanModal').style.display = 'block';
}

function viewThreatDetails(id) {
  showNotification(`Threat ID: ${id}`, 'info');
}

function updateThreatStatus(id) {
  document.getElementById('threatIdInput').value = id;
  document.getElementById('threatNotesInput').value = '';
  document.getElementById('threatModal').style.display = 'block';
}

function addNewUser() {
  document.getElementById('userForm').reset();
  document.getElementById('userIdInput').value = '';
  document.getElementById('userModalTitle').textContent = 'Add New User';
  document.getElementById('userSubmitBtn').textContent = 'Create';
  document.getElementById('userEmailInput').disabled = false;
  document.getElementById('userPasswordInput').value = '';
  document.getElementById('userPasswordInput').style.display = 'block';
  document.getElementById('userModal').style.display = 'block';
}

async function editUser(id) {
  try {
    const res = await apiFetch('/api/users?limit=200');
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    const user = (data.items || []).find((u) => String(u._id) === String(id));
    if (!user) return showNotification('User not found', 'error');
    document.getElementById('userIdInput').value = user._id;
    document.getElementById('userNameInput').value = user.name || '';
    document.getElementById('userEmailInput').value = user.email || '';
    document.getElementById('userRoleInput').value = user.role || 'user';
    document.getElementById('userStatusInput').value = user.status || 'active';
    document.getElementById('userModalTitle').textContent = 'Edit User';
    document.getElementById('userSubmitBtn').textContent = 'Update';
    document.getElementById('userEmailInput').disabled = true;
    document.getElementById('userPasswordInput').value = '';
    document.getElementById('userPasswordInput').style.display = 'none';
    document.getElementById('userModal').style.display = 'block';
  } catch {
    showNotification('Failed to load user', 'error');
  }
}

function viewUserDetails(id) {
  showNotification(`User ID: ${id}`, 'info');
}

function saveSettings() {
  showNotification('Settings saved locally (demo)', 'success');
}

function showNotification(message, type = 'info') {
  const n = document.createElement('div');
  n.className = `notification notification-${type}`;
  n.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${escapeHtml(message)}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
    </div>
  `;
  n.style.cssText = `
    position:fixed;top:20px;right:20px;
    background:${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color:#fff;padding:1rem;border-radius:8px;z-index:10000;max-width:420px;
    animation:slideInRight .3s ease-out;
  `;
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = '@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}';
    document.head.appendChild(style);
  }
  document.body.appendChild(n);
  setTimeout(() => n.parentElement && n.remove(), 5000);
}

function logout() {
  if (!confirm('Are you sure you want to logout?')) return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('admin_username');
  localStorage.removeItem('admin_remember');
  window.location.href = '../adminlogin.html';
}

function capitalize(s) {
  const v = String(s || '');
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function addDynamicStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .threat-level.high{background:#fee2e2;color:#dc2626;padding:.25rem .5rem;border-radius:6px;font-size:.75rem;font-weight:600}
    .threat-level.medium{background:#fef3c7;color:#d97706;padding:.25rem .5rem;border-radius:6px;font-size:.75rem;font-weight:600}
    .threat-level.low{background:#dcfce7;color:#16a34a;padding:.25rem .5rem;border-radius:6px;font-size:.75rem;font-weight:600}
    .status.blocked{background:#fee2e2;color:#dc2626;padding:.25rem .5rem;border-radius:6px;font-size:.75rem;font-weight:600}
    .status.investigating{background:#fef3c7;color:#d97706;padding:.25rem .5rem;border-radius:6px;font-size:.75rem;font-weight:600}
    .status.monitored{background:#dbeafe;color:#2563eb;padding:.25rem .5rem;border-radius:6px;font-size:.75rem;font-weight:600}
    .status.active{background:#dcfce7;color:#16a34a;padding:.25rem .5rem;border-radius:6px;font-size:.75rem;font-weight:600}
    .status.suspended{background:#fef2f2;color:#b91c1c;padding:.25rem .5rem;border-radius:6px;font-size:.75rem;font-weight:600}
    .role.user{background:#dbeafe;color:#2563eb;padding:.25rem .5rem;border-radius:6px;font-size:.75rem;font-weight:600}
    .role.admin{background:#fee2e2;color:#dc2626;padding:.25rem .5rem;border-radius:6px;font-size:.75rem;font-weight:600}
    .btn-sm{padding:.5rem 1rem;font-size:.75rem;margin-right:.5rem}
    .btn-secondary{background:#6b7280;color:#fff}
    .btn-secondary:hover{background:#4b5563}
    .notification-content{display:flex;justify-content:space-between;align-items:center}
    .notification-close{background:none;border:none;color:#fff;font-size:1.25rem;cursor:pointer;margin-left:.75rem}
  `;
  document.head.appendChild(style);
}

addDynamicStyles();
