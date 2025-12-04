import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, q, role, status, sort = '-createdAt' } = req.query || {};
    const query = {};
    if (q) {
      const r = new RegExp(String(q), 'i');
      query.$or = [{ name: r }, { email: r }, { username: r }];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [items, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sort)
        .skip((p - 1) * l)
        .limit(l)
        .lean(),
      User.countDocuments(query),
    ]);

    return res.json({ items, total, page: p, limit: l });
  } catch (err) {
    return next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, username, role = 'user', password } = req.body || {};
    if (!name || !email) return res.status(400).json({ message: 'name and email are required' });

    const exists = await User.findOne({ $or: [{ email }, username ? { username } : null].filter(Boolean) });
    if (exists) return res.status(409).json({ message: 'User already exists' });

    const pwd = password && String(password).trim().length >= 6
      ? String(password).trim()
      : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const hash = await bcrypt.hash(pwd, await bcrypt.genSalt(rounds));

    const doc = await User.create({ name, email, username, role, password: hash });
    const user = doc.toJSON();
    return res.status(201).json({ user, tempPassword: password ? undefined : pwd });
  } catch (err) {
    return next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, status, name } = req.body || {};
    const payload = {};
    if (role) payload.role = role;
    if (status) payload.status = status;
    if (name) payload.name = name;

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) return res.status(404).json({ message: 'User not found' });
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
};
