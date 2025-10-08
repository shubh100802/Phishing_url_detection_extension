export const listUsers = async (req, res, next) => {
  try {
    const items = [
      { id: 'u_1', name: 'Shubham Raj Sharma', email: 'admin@example.com', role: 'admin', status: 'active', lastLogin: new Date().toISOString() },
      { id: 'u_2', name: 'Aarav Verma', email: 'user@example.com', role: 'user', status: 'active', lastLogin: new Date(Date.now() - 86400000).toISOString() }
    ];
    return res.json({ items, total: items.length });
  } catch (err) {
    return next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, role = 'user' } = req.body || {};
    if (!name || !email) return res.status(400).json({ message: 'name and email are required' });
    return res.status(201).json({ id: 'u_' + Math.random().toString(36).slice(2), name, email, role, status: 'active' });
  } catch (err) {
    return next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body || {};
    return res.json({ id, role: role || 'user', status: status || 'active' });
  } catch (err) {
    return next(err);
  }
};
