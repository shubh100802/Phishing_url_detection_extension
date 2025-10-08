import crypto from 'node:crypto';
export const scanUrl = async (req, res, next) => {
  try {
    const { url, deepScan = false, saveHistory = true } = req.body || {};

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'url is required' });
    }

    // Mocked verdict and sources for now (Phase 4 - mocked data)
    const normalized = url.trim();
    const riskScore = Math.random() * (deepScan ? 0.4 : 0.6); // mock logic
    const label = riskScore > 0.7 ? 'malicious' : riskScore > 0.4 ? 'suspicious' : 'safe';

    const result = {
      url: normalized,
      verdict: label,
      riskScore: Number(riskScore.toFixed(2)),
      sources: [
        { name: 'Heuristic', verdict: label, score: riskScore },
      ],
      options: { deepScan, saveHistory },
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    };

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};
