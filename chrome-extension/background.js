const API_BASES = ['http://localhost:3001', 'http://localhost:3000'];
const scannedCache = new Map();
const RESCAN_COOLDOWN_MS = 2 * 60 * 1000;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'scanUrl') {
    postPublicScan({ url: message.url, deepScan: true })
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: err?.message || 'Scan failed' }));
    return true;
  }
  return undefined;
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== 'scanResult') return;
  handleScanResult(message.payload || {});
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  const url = tab?.url || '';
  if (!/^https?:\/\//i.test(url)) return;

  const now = Date.now();
  const last = scannedCache.get(url) || 0;
  if (now - last < RESCAN_COOLDOWN_MS) return;
  scannedCache.set(url, now);

  try {
    const data = await postPublicScan({ url, deepScan: true });
    const payload = { url, verdict: data.verdict, riskScore: data.riskScore };
    handleScanResult(payload);
    if (data.verdict === 'malicious' || data.verdict === 'suspicious') {
      chrome.tabs.sendMessage(tabId, { type: 'rudrakshaWarning', payload });
    }
  } catch {
    // backend unavailable, skip quietly
  }
});

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

function handleScanResult({ verdict, url, riskScore }) {
  const level = String(verdict || '').toLowerCase();
  if (level === 'malicious' || level === 'suspicious') {
    const badge = level === 'malicious' ? '!' : '?';
    chrome.action.setBadgeText({ text: badge });
    chrome.action.setBadgeBackgroundColor({ color: level === 'malicious' ? '#dc2626' : '#d97706' });
    console.warn('[RUDRAKSHA]', verdict, riskScore, url);
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}
