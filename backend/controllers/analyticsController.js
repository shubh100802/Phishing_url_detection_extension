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

    const recentThreats = await Threat.find({})
      .sort('-createdAt')
      .limit(5)
      .lean();

    const recentScans = await Scan.find({})
      .sort('-createdAt')
      .limit(5)
      .lean();

    // Merge recent activity from threats and scans
    const activities = [
      ...recentThreats.map(t => ({
        type: 'threat',
        title: 'New phishing threat detected',
        message: `${t.url} ${t.status}`,
        time: t.createdAt || t.detectedAt || new Date(),
      })),
      ...recentScans.map(s => ({
        type: 'scan',
        title: 'URL scanned',
        message: `${s.url} → ${s.verdict} (${s.riskScore})`,
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
