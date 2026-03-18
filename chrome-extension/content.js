(() => {
  if (!/^https?:/i.test(location.href)) return;
  window.__RUDRAKSHA_ACTIVE__ = true;

  const STORAGE_KEY = 'rudrakshaAllowedHosts';
  const host = location.host;

  init().catch(() => {
    // If anything fails very early, keep page blocked with manual controls.
  });

  async function init() {
    const allowMap = await getStorage(STORAGE_KEY);
    const allowedUntil = Number((allowMap && allowMap[host]) || 0);
    if (Date.now() < allowedUntil) return;

    const blocker = createBlocker('RUDRAKSHA: The Saviour is verifying this URL...');
    const res = await sendScanRequest(location.href);
    if (!res.ok) {
      renderUnverifiedDecision(blocker, res.error || 'Could not verify site');
      return;
    }

    const verdict = String(res.data?.verdict || '').toLowerCase();
    const riskScore = res.data?.riskScore;
    const source = res.data?.sources?.[0]?.name || 'Heuristic';

    notifyScanResult(location.href, verdict, riskScore);

    if (verdict === 'safe') {
      blocker.remove();
      return;
    }

    renderDecision(blocker, verdict, riskScore, source);
  }

  function createBlocker(message) {
    const overlay = document.createElement('div');
    overlay.id = 'rudraksha-blocker';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:2147483647',
      'background:#020617',
      'color:#f8fafc',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font:16px Inter, Arial, sans-serif',
      'text-align:center',
      'padding:24px',
      'pointer-events:all',
    ].join(';');
    overlay.innerHTML = `
      <div style="max-width:760px;">
        <div style="font-size:13px;letter-spacing:.08em;color:#93c5fd;margin-bottom:8px;">RUDRAKSHA: THE SAVIOUR SECURITY</div>
        <h2 style="margin:0 0 12px 0;">Website Verification</h2>
        <p style="margin:0;">${escapeHtml(message)}</p>
      </div>
    `;
    document.documentElement.appendChild(overlay);
    return overlay;
  }

  function renderDecision(overlay, verdict, riskScore, source) {
    const color = verdict === 'malicious' ? '#dc2626' : '#f59e0b';
    const card = document.createElement('div');
    card.style.cssText = 'max-width:780px;background:#0f172a;border:1px solid #334155;border-radius:12px;padding:22px;text-align:left;';
    card.innerHTML = `
      <div style="font-size:13px;letter-spacing:.08em;color:#93c5fd;margin-bottom:8px;">RUDRAKSHA: THE SAVIOUR SECURITY</div>
      <h2 style="margin:0 0 10px 0;color:${color}">Potentially Unsafe Site</h2>
      <p style="margin:0 0 8px 0;">URL: <strong>${escapeHtml(location.href)}</strong></p>
      <p style="margin:0 0 6px 0;">Verdict: <strong>${escapeHtml(verdict.toUpperCase())}</strong></p>
      <p style="margin:0 0 6px 0;">Risk Score: <strong>${escapeHtml(String(riskScore))}</strong></p>
      <p style="margin:0 0 16px 0;">Analysis Source: <strong>${escapeHtml(source)}</strong></p>
      <p style="margin:0 0 18px 0;">Proceed only if you trust this site.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button id="rudrakshaProceedBtn" style="background:#16a34a;color:#fff;border:0;border-radius:8px;padding:10px 14px;cursor:pointer;">Proceed Anyway</button>
        <button id="rudrakshaBackBtn" style="background:#dc2626;color:#fff;border:0;border-radius:8px;padding:10px 14px;cursor:pointer;">Go Back</button>
      </div>
    `;
    overlay.innerHTML = '';
    overlay.appendChild(card);

    card.querySelector('#rudrakshaProceedBtn')?.addEventListener('click', async () => {
      const current = await getStorage(STORAGE_KEY);
      current[host] = Date.now() + 24 * 60 * 60 * 1000;
      await setStorage(STORAGE_KEY, current);
      overlay.remove();
    });

    card.querySelector('#rudrakshaBackBtn')?.addEventListener('click', leaveSite);
  }

  function renderUnverifiedDecision(overlay, reason) {
    const card = document.createElement('div');
    card.style.cssText = 'max-width:780px;background:#0f172a;border:1px solid #334155;border-radius:12px;padding:22px;text-align:left;';
    card.innerHTML = `
      <div style="font-size:13px;letter-spacing:.08em;color:#93c5fd;margin-bottom:8px;">RUDRAKSHA: THE SAVIOUR SECURITY</div>
      <h2 style="margin:0 0 10px 0;color:#f59e0b">Verification Unavailable</h2>
      <p style="margin:0 0 6px 0;">URL: <strong>${escapeHtml(location.href)}</strong></p>
      <p style="margin:0 0 16px 0;">Reason: ${escapeHtml(reason)}</p>
      <p style="margin:0 0 18px 0;">Site is blocked until you choose what to do.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button id="rudrakshaRetryBtn" style="background:#2563eb;color:#fff;border:0;border-radius:8px;padding:10px 14px;cursor:pointer;">Retry Verification</button>
        <button id="rudrakshaProceedBtn" style="background:#16a34a;color:#fff;border:0;border-radius:8px;padding:10px 14px;cursor:pointer;">Proceed Anyway</button>
        <button id="rudrakshaBackBtn" style="background:#dc2626;color:#fff;border:0;border-radius:8px;padding:10px 14px;cursor:pointer;">Go Back</button>
      </div>
    `;
    overlay.innerHTML = '';
    overlay.appendChild(card);

    card.querySelector('#rudrakshaRetryBtn')?.addEventListener('click', () => {
      overlay.remove();
      init();
    });
    card.querySelector('#rudrakshaProceedBtn')?.addEventListener('click', async () => {
      const current = await getStorage(STORAGE_KEY);
      current[host] = Date.now() + 2 * 60 * 60 * 1000; // shorter bypass when not verified
      await setStorage(STORAGE_KEY, current);
      overlay.remove();
    });
    card.querySelector('#rudrakshaBackBtn')?.addEventListener('click', leaveSite);
  }

  function leaveSite() {
    if (history.length > 1) history.back();
    else location.replace('about:blank');
  }

  function sendScanRequest(url) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'scanUrl', url }, (resp) => {
        if (chrome.runtime.lastError) return resolve({ ok: false, error: chrome.runtime.lastError.message });
        resolve(resp || { ok: false, error: 'No response' });
      });
    });
  }

  function notifyScanResult(url, verdict, riskScore) {
    chrome.runtime.sendMessage({
      type: 'scanResult',
      payload: { url, verdict, riskScore },
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
