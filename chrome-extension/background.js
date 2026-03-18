const API_BASES = ['http://localhost:3001', 'http://localhost:3000'];

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
