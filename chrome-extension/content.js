(() => {
  if (!/^https?:/i.test(location.href)) return;
  window.__RUDRAKSHA_ACTIVE__ = true;

  const STORAGE_KEY = 'rudrakshaAllowedHosts';
  const host = location.host;

  init().catch(() => {
    // fail-open if extension storage/api fails
  });

  async function init() {
    const allowMap = await getStorage(STORAGE_KEY);
    const allowedUntil = Number((allowMap && allowMap[host]) || 0);
    if (Date.now() < allowedUntil) return;

    const blocker = createBlocker('RUDRAKSHA is checking this URL...');
    const res = await sendScanRequest(location.href);
    if (!res.ok) {
      blocker.remove();
      return;
    }

    const verdict = String(res.data?.verdict || '').toLowerCase();
    const riskScore = res.data?.riskScore;

    if (verdict === 'safe') {
      blocker.remove();
      return;
    }

    renderDecision(blocker, verdict, riskScore);
  }

  function createBlocker(message) {
    const overlay = document.createElement('div');
    overlay.id = 'rudraksha-blocker';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:2147483647',
      'background:#0b1220',
      'color:#f8fafc',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font:16px Inter, Arial, sans-serif',
      'text-align:center',
      'padding:24px',
      'pointer-events:all',
    ].join(';');
    overlay.innerHTML = `<div style="max-width:640px;"><h2 style="margin:0 0 12px 0;">RUDRAKSHA Protection</h2><p id="rudraksha-msg" style="margin:0;">${escapeHtml(message)}</p></div>`;
    document.documentElement.appendChild(overlay);
    return overlay;
  }

  function renderDecision(overlay, verdict, riskScore) {
    const color = verdict === 'malicious' ? '#b91c1c' : '#b45309';
    overlay.style.background = '#111827';
    const content = document.createElement('div');
    content.style.cssText = 'max-width:720px;background:#0f172a;border:1px solid #334155;border-radius:12px;padding:22px;';
    content.innerHTML = `
      <h2 style="margin:0 0 10px 0;color:${color}">Potentially Unsafe Site</h2>
      <p style="margin:0 0 8px 0;">Verdict: <strong>${escapeHtml(verdict.toUpperCase())}</strong></p>
      <p style="margin:0 0 16px 0;">Risk Score: <strong>${escapeHtml(String(riskScore))}</strong></p>
      <p style="margin:0 0 18px 0;">Do you want to proceed to this site?</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <button id="rudrakshaProceedBtn" style="background:#16a34a;color:white;border:0;border-radius:8px;padding:10px 14px;cursor:pointer;">Proceed Anyway</button>
        <button id="rudrakshaBackBtn" style="background:#dc2626;color:white;border:0;border-radius:8px;padding:10px 14px;cursor:pointer;">Go Back</button>
      </div>
    `;
    overlay.innerHTML = '';
    overlay.appendChild(content);

    content.querySelector('#rudrakshaProceedBtn')?.addEventListener('click', async () => {
      const current = await getStorage(STORAGE_KEY);
      current[host] = Date.now() + 24 * 60 * 60 * 1000; // 24h allow
      await setStorage(STORAGE_KEY, current);
      overlay.remove();
    });

    content.querySelector('#rudrakshaBackBtn')?.addEventListener('click', () => {
      if (history.length > 1) history.back();
      else location.replace('about:blank');
    });
  }

  function sendScanRequest(url) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'scanUrl', url }, (resp) => {
        if (chrome.runtime.lastError) return resolve({ ok: false, error: chrome.runtime.lastError.message });
        resolve(resp || { ok: false, error: 'No response' });
      });
    });
  }

  function getStorage(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (res) => resolve(res[key] || {}));
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
})();
