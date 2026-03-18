import Scan from '../models/Scan.js';
import Threat from '../models/Threat.js';

const suspiciousKeywords = [
  'login',
  'signin',
  'verify',
  'account',
  'confirm',
  'bank',
  'wallet',
  'gift',
  'free',
  'bonus',
  'prize',
];

const normalizeUrl = (input) => {
  let normalized = String(input || '').trim().toLowerCase();
  if (!/^https?:\/\//.test(normalized)) normalized = 'http://' + normalized;
  try {
    const u = new URL(normalized);
    normalized = (u.hostname + u.pathname + (u.search || '')).replace(/\/$/, '');
  } catch {
    // keep fallback string
  }
  return normalized;
};

const analyzeUrl = (url, deepScan) => {
  const keywordHit = suspiciousKeywords.some((k) => url.includes(k));
  const tldRisk = /\.(ru|cn|tk|work|zip|click|info|top|xyz)(\/|$)/i.test(url) ? 0.25 : 0;
  const ipLike = /(^|\/)\d{1,3}(?:\.\d{1,3}){3}(\/|:|$)/.test(url) ? 0.2 : 0;
  const manyHyphens = (url.match(/-/g) || []).length >= 4 ? 0.15 : 0;
  const longUrl = url.length > 70 ? 0.2 : url.length > 50 ? 0.1 : 0;
  const subdomainCount = (url.match(/\./g) || []).length;
  const deepPenalty = deepScan ? 0.15 : 0;
  const base =
    0.1 +
    (keywordHit ? 0.25 : 0) +
    tldRisk +
    ipLike +
    manyHyphens +
    longUrl +
    (subdomainCount > 3 ? 0.1 : 0) +
    deepPenalty;
  const jitter = Math.random() * (deepScan ? 0.15 : 0.25);
  const riskScore = Math.max(0, Math.min(1, base + jitter));
  const verdict = riskScore > 0.75 ? 'malicious' : riskScore > 0.45 ? 'suspicious' : 'safe';

  return {
    verdict,
    riskScore: Number(riskScore.toFixed(2)),
    sources: [{ name: 'Heuristic', verdict, score: Number(riskScore.toFixed(2)) }],
  };
};

const maybeUpsertThreat = async (url, verdict) => {
  if (verdict === 'safe') return;
  const level = verdict === 'malicious' ? 'high' : 'medium';
  const status = verdict === 'malicious' ? 'blocked' : 'investigating';
  await Threat.findOneAndUpdate(
    { url },
    {
      $setOnInsert: { detectedAt: new Date() },
      $set: { level, status },
    },
    { upsert: true, new: true }
  );
};

const createResult = (url, deepScan, saveHistory, scan) => {
  const result = analyzeUrl(url, deepScan);
  return {
    url,
    verdict: result.verdict,
    riskScore: result.riskScore,
    sources: result.sources,
    options: { deepScan, saveHistory },
    timestamp: scan?.timestamp?.toISOString?.() || new Date().toISOString(),
    id: scan?._id,
  };
};

export const scanUrl = async (req, res, next) => {
  try {
    const { url, deepScan = false, saveHistory = true } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'url is required' });
    }

    const normalized = normalizeUrl(url);
    const result = analyzeUrl(normalized, deepScan);

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

    await maybeUpsertThreat(normalized, result.verdict);
    return res.status(200).json(createResult(normalized, deepScan, saveHistory, scanDoc));
  } catch (err) {
    return next(err);
  }
};

export const publicScanUrl = async (req, res, next) => {
  try {
    const { url, deepScan = false } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'url is required' });
    }

    const normalized = normalizeUrl(url);
    const result = analyzeUrl(normalized, deepScan);
    await maybeUpsertThreat(normalized, result.verdict);

    return res.status(200).json({
      url: normalized,
      verdict: result.verdict,
      riskScore: result.riskScore,
      sources: result.sources,
      options: { deepScan, saveHistory: false },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return next(err);
  }
};

export const getScanHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query || {};
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const query = { userId: req.user.id };
    const [items, total] = await Promise.all([
      Scan.find(query).sort('-createdAt').skip((p - 1) * l).limit(l).lean(),
      Scan.countDocuments(query),
    ]);

    return res.json({ items, total, page: p, limit: l });
  } catch (err) {
    return next(err);
  }
};

export const getUserScanStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [totalScans, safeScans, suspiciousScans, maliciousScans, lastScan] = await Promise.all([
      Scan.countDocuments({ userId }),
      Scan.countDocuments({ userId, verdict: 'safe' }),
      Scan.countDocuments({ userId, verdict: 'suspicious' }),
      Scan.countDocuments({ userId, verdict: 'malicious' }),
      Scan.findOne({ userId }).sort('-createdAt').lean(),
    ]);

    return res.json({
      totalScans,
      safeScans,
      suspiciousScans,
      maliciousScans,
      lastScan,
    });
  } catch (err) {
    return next(err);
  }
};
