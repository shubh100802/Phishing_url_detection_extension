import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || '12', 10));
    const hash = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hash, role: role === 'admin' ? 'admin' : 'user' });

    const token = signToken({ id: user._id, role: user.role, email: user.email, name: user.name });

    return res.status(201).json({ user: user.toJSON(), accessToken: token });
  } catch (err) {
    return next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    if ((!email && !username) || !password) {
      return res.status(400).json({ message: 'Email or username and password are required' });
    }

    const user = await User.findOne(
      email ? { email } : { username }
    );
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'User is not active' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({ id: user._id, role: user.role, email: user.email, name: user.name });
    return res.json({ user: user.toJSON(), accessToken: token });
  } catch (err) {
    return next(err);
  }
};
