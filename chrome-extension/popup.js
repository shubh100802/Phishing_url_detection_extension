const API_BASES = ['http://localhost:3001', 'http://localhost:3000'];

const urlInput = document.getElementById('urlInput');
const deepScan = document.getElementById('deepScan');
const scanBtn = document.getElementById('scanBtn');
const result = document.getElementById('result');

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.startsWith('http')) {
      urlInput.value = tab.url;
    }
  } catch {
    // ignore
  }
});

scanBtn.addEventListener('click', scanNow);

async function scanNow() {
  const url = (urlInput.value || '').trim();
  if (!url) return show('Enter a URL first', 'suspicious');

  scanBtn.disabled = true;
  scanBtn.textContent = 'Scanning...';
  show('Scanning...', '');

  try {
    const payload = { url, deepScan: Boolean(deepScan.checked) };
    const data = await postPublicScan(payload);
    const cls = String(data.verdict || '').toLowerCase();
    show(`Verdict: ${data.verdict} | Risk: ${data.riskScore}`, cls);
    notifyResult(url, data.verdict, data.riskScore);
  } catch (err) {
    show(`Scan failed: ${err.message || 'Unknown error'}`, 'malicious');
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = 'Scan Current URL';
  }
}

async function postPublicScan(payload) {
  let lastErr;
  for (const base of API_BASES) {
    try {
      const res = await fetch(`${base}/api/scan/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

function notifyResult(url, verdict, riskScore) {
  chrome.runtime.sendMessage({
    type: 'scanResult',
    payload: { url, verdict, riskScore },
  });
}
