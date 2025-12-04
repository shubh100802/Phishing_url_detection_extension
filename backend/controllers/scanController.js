import Scan from '../models/Scan.js';
import Threat from '../models/Threat.js';

export const scanUrl = async (req, res, next) => {
  try {
    const { url, deepScan = false, saveHistory = true } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'url is required' });
    }

    let normalized = String(url).trim().toLowerCase();
    // Basic normalization: ensure protocol prefix for parsing, remove trailing slash
    if (!/^https?:\/\//.test(normalized)) normalized = 'http://' + normalized;
    try { const u = new URL(normalized); normalized = (u.hostname + u.pathname + (u.search || '')).replace(/\/$/, ''); } catch {}

    const suspiciousKeywords = ['login', 'signin', 'verify', 'account', 'confirm', 'bank', 'wallet', 'gift', 'free', 'bonus', 'prize'];
    const keywordHit = suspiciousKeywords.some(k => normalized.includes(k));
    const tldRisk = /\.(ru|cn|tk|work|zip|click|info|top|xyz)(\/|$)/i.test(normalized) ? 0.25 : 0;
    const ipLike = /(^|\/)\d{1,3}(?:\.\d{1,3}){3}(\/|:|$)/.test(normalized) ? 0.2 : 0;
    const manyHyphens = (normalized.match(/-/g) || []).length >= 4 ? 0.15 : 0;
    const longUrl = normalized.length > 70 ? 0.2 : normalized.length > 50 ? 0.1 : 0;
    const subdomainCount = (normalized.match(/\./g) || []).length;
    const deepPenalty = deepScan ? 0.15 : 0; // deep scan increases risk sensitivity
    const base = 0.1 + (keywordHit ? 0.25 : 0) + tldRisk + ipLike + manyHyphens + longUrl + (subdomainCount > 3 ? 0.1 : 0) + deepPenalty;
    const jitter = Math.random() * (deepScan ? 0.15 : 0.25);
    const riskScore = Math.max(0, Math.min(1, base + jitter));
    const verdict = riskScore > 0.75 ? 'malicious' : riskScore > 0.45 ? 'suspicious' : 'safe';

    const result = {
      url: normalized,
      verdict,
      riskScore: Number(riskScore.toFixed(2)),
      sources: [
        { name: 'Heuristic', verdict, score: Number(riskScore.toFixed(2)) },
      ],
      options: { deepScan, saveHistory },
      timestamp: new Date().toISOString(),
    };

    let scanDoc = null;
    if (saveHistory) {
      scanDoc = await Scan.create({
        userId: req.user?.id || null,
        url: normalized,
        verdict: result.verdict,
        riskScore: result.riskScore,
        sources: result.sources,
        options: { deepScan, saveHistory },
        timestamp: new Date(),
      });
    }

    if (verdict !== 'safe') {
      const level = verdict === 'malicious' ? 'high' : 'medium';
      const status = verdict === 'malicious' ? 'blocked' : 'investigating';
      await Threat.findOneAndUpdate(
        { url: normalized },
        {
          $setOnInsert: { detectedAt: new Date() },
          $set: { level, status },
        },
        { upsert: true, new: true }
      );
    }

    return res.status(200).json({ ...result, id: scanDoc?._id });
  } catch (err) {
    return next(err);
  }
};
