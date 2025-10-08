export const listThreats = async (req, res, next) => {
  try {
    const items = [
      {
        id: 't_1',
        url: 'malicious-site.com',
        level: 'high',
        status: 'blocked',
        detectedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      },
      {
        id: 't_2',
        url: 'suspicious-site.net',
        level: 'medium',
        status: 'investigating',
        detectedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
    ];
    return res.json({ items, total: items.length });
  } catch (err) {
    return next(err);
  }
};

export const updateThreat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, level, notes } = req.body || {};
    // Mock update
    return res.json({ id, status: status || 'blocked', level: level || 'high', notes: notes || '' });
  } catch (err) {
    return next(err);
  }
};
