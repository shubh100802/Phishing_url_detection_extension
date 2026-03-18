import Threat from '../models/Threat.js';
import User from '../models/User.js';
import Scan from '../models/Scan.js';

export const getOverview = async (req, res, next) => {
  try {
    const [totalThreats, blockedThreats, activeUsers] = await Promise.all([
      Threat.estimatedDocumentCount(),
      Threat.countDocuments({ status: 'blocked' }),
      User.countDocuments({ status: 'active' }),
    ]);

    const recentThreats = await Threat.find({}).sort('-createdAt').limit(5).lean();
    const recentScans = await Scan.find({}).sort('-createdAt').limit(5).lean();

    const activities = [
      ...recentThreats.map((t) => ({
        type: 'threat',
        title: 'New phishing threat detected',
        message: `${t.url} ${t.status}`,
        time: t.createdAt || t.detectedAt || new Date(),
      })),
      ...recentScans.map((s) => ({
        type: 'scan',
        title: 'URL scanned',
        message: `${s.url} -> ${s.verdict} (${s.riskScore})`,
        time: s.createdAt || s.timestamp || new Date(),
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 8);

    return res.json({
      stats: {
        totalThreats,
        blockedThreats,
        activeUsers,
        uptimePercent: 99.9,
      },
      activities,
    });
  } catch (err) {
    return next(err);
  }
};

export const getTrends = async (req, res, next) => {
  try {
    const days = Math.min(90, Math.max(7, parseInt(req.query.days || '30', 10)));
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [scans, threats] = await Promise.all([
      Scan.find({ createdAt: { $gte: start } }).select('createdAt verdict').lean(),
      Threat.find({ createdAt: { $gte: start } }).select('createdAt level status').lean(),
    ]);

    const dayMap = new Map();
    for (let i = 0; i < days; i += 1) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { date: key, scans: 0, threats: 0, blocked: 0 });
    }

    scans.forEach((s) => {
      const key = new Date(s.createdAt || Date.now()).toISOString().slice(0, 10);
      const rec = dayMap.get(key);
      if (rec) rec.scans += 1;
    });

    threats.forEach((t) => {
      const key = new Date(t.createdAt || Date.now()).toISOString().slice(0, 10);
      const rec = dayMap.get(key);
      if (rec) {
        rec.threats += 1;
        if (t.status === 'blocked') rec.blocked += 1;
      }
    });

    const levelCounts = { low: 0, medium: 0, high: 0 };
    threats.forEach((t) => {
      if (levelCounts[t.level] != null) levelCounts[t.level] += 1;
    });

    return res.json({
      days,
      series: Array.from(dayMap.values()),
      levelCounts,
    });
  } catch (err) {
    return next(err);
  }
};
