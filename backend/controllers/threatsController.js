import Threat from '../models/Threat.js';

export const listThreats = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      level,
      q,
      sort = '-detectedAt',
    } = req.query || {};

    const query = {};
    if (status) query.status = status;
    if (level) query.level = level;
    if (q) query.url = { $regex: String(q), $options: 'i' };

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [items, total] = await Promise.all([
      Threat.find(query)
        .sort(sort)
        .skip((p - 1) * l)
        .limit(l)
        .lean(),
      Threat.countDocuments(query),
    ]);

    return res.json({ items, total, page: p, limit: l });
  } catch (err) {
    return next(err);
  }
};

export const updateThreat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, level, notes } = req.body || {};

    const payload = {};
    if (status) payload.status = status;
    if (level) payload.level = level;
    if (typeof notes === 'string') payload.notes = notes;

    const updated = await Threat.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: 'Threat not found' });
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
};
