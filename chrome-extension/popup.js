const API_BASES = ['http://localhost:3001', 'http://localhost:3000'];
const AUTH_KEY = 'rudrakshaAuth';

const urlInput = document.getElementById('urlInput');
const deepScan = document.getElementById('deepScan');
const scanBtn = document.getElementById('scanBtn');
const result = document.getElementById('result');
const historyList = document.getElementById('historyList');

const authLoggedOut = document.getElementById('authLoggedOut');
const authLoggedIn = document.getElementById('authLoggedIn');
const authMsg = document.getElementById('authMsg');
const whoami = document.getElementById('whoami');

let auth = { accessToken: '', user: null };

document.addEventListener('DOMContentLoaded', async () => {
  auth = await getStorage(AUTH_KEY);
  if (!auth || typeof auth !== 'object') auth = { accessToken: '', user: null };
  renderAuthState();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.startsWith('http')) urlInput.value = tab.url;
  } catch {}

  if (auth.accessToken) await loadHistory();
});

scanBtn.addEventListener('click', scanNow);
document.getElementById('refreshHistoryBtn').addEventListener('click', loadHistory);

document.getElementById('showLoginBtn').addEventListener('click', () => toggleAuthPanel(true));
document.getElementById('showSignupBtn').addEventListener('click', () => toggleAuthPanel(false));
document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('signupBtn').addEventListener('click', signup);
document.getElementById('logoutBtn').addEventListener('click', logout);

function toggleAuthPanel(showLogin) {
  document.getElementById('loginPanel').classList.toggle('hidden', !showLogin);
  document.getElementById('signupPanel').classList.toggle('hidden', showLogin);
}

function renderAuthState() {
  const loggedIn = Boolean(auth?.accessToken);
  authLoggedOut.classList.toggle('hidden', loggedIn);
  authLoggedIn.classList.toggle('hidden', !loggedIn);
  if (loggedIn) whoami.textContent = `Logged in as ${auth.user?.name || auth.user?.email || 'User'} (${auth.user?.role || 'user'})`;
  authMsg.textContent = '';
}

async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  if (!email || !password) return setAuthMsg('Please enter email and password');
  try {
    const data = await post('/api/auth/login', { email, password });
    auth = { accessToken: data.accessToken, user: data.user };
    await setStorage(AUTH_KEY, auth);
    renderAuthState();
    setAuthMsg('Login successful');
    loadHistory();
  } catch (err) {
    setAuthMsg(`Login failed: ${err.message}`);
  }
}

async function signup() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value.trim();
  if (!name || !email || password.length < 6) return setAuthMsg('Enter name/email and password >= 6');
  try {
    const data = await post('/api/auth/register', { name, email, password });
    auth = { accessToken: data.accessToken, user: data.user };
    await setStorage(AUTH_KEY, auth);
    renderAuthState();
    setAuthMsg('Signup successful');
    loadHistory();
  } catch (err) {
    setAuthMsg(`Signup failed: ${err.message}`);
  }
}

async function logout() {
  auth = { accessToken: '', user: null };
  await setStorage(AUTH_KEY, auth);
  renderAuthState();
  historyList.innerHTML = '<li class="small">Login to view your recent scans.</li>';
  setAuthMsg('Logged out');
}

async function scanNow() {
  const url = (urlInput.value || '').trim();
  if (!url) return show('Enter a URL first', 'suspicious');

  scanBtn.disabled = true;
  scanBtn.textContent = 'Scanning...';
  show('Scanning...', '');

  try {
    const data = auth.accessToken
      ? await post('/api/scan', { url, deepScan: Boolean(deepScan.checked), saveHistory: true }, auth.accessToken)
      : await post('/api/scan/public', { url, deepScan: Boolean(deepScan.checked) });

    const cls = String(data.verdict || '').toLowerCase();
    const details = [
      `Verdict: ${data.verdict}`,
      `Risk: ${data.riskScore}`,
      `Source: ${(data.sources && data.sources[0] && data.sources[0].name) || 'Heuristic'}`,
    ].join('\n');
    show(details, cls);
    notifyResult(url, data.verdict, data.riskScore);
    if (auth.accessToken) loadHistory();
  } catch (err) {
    show(`Scan failed: ${err.message || 'Unknown error'}`, 'malicious');
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = 'Scan Current URL';
  }
}

async function loadHistory() {
  if (!auth.accessToken) {
    historyList.innerHTML = '<li class="small">Login to view your recent scans.</li>';
    return;
  }
  try {
    const data = await get('/api/scan/history?limit=5', auth.accessToken);
    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length) {
      historyList.innerHTML = '<li class="small">No scan history yet.</li>';
      return;
    }
    historyList.innerHTML = items
      .map((x) => `<li>${escapeHtml(x.url || '')} - <strong>${escapeHtml(String(x.verdict || '').toUpperCase())}</strong> (${escapeHtml(String(x.riskScore ?? 'N/A'))})</li>`)
      .join('');
  } catch (err) {
    historyList.innerHTML = `<li class="small">History error: ${escapeHtml(err.message || 'Unknown')}</li>`;
  }
}

async function get(path, token) {
  let lastErr;
  for (const base of API_BASES) {
    try {
      const res = await fetch(`${base}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Backend not reachable');
}

async function post(path, payload, token = '') {
  let lastErr;
  for (const base of API_BASES) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Backend not reachable');
}

function show(message, cls) {
  result.className = `status ${cls || ''}`;
  result.textContent = message;
}

function setAuthMsg(message) {
  authMsg.textContent = message || '';
}

function notifyResult(url, verdict, riskScore) {
  chrome.runtime.sendMessage({ type: 'scanResult', payload: { url, verdict, riskScore } });
}

function getStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (res) => resolve(res[key] || { accessToken: '', user: null }));
  });
}

function setStorage(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => resolve());
  });
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
