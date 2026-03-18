import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const seedAdmin = async () => {
  try {
    const username = process.env.SEED_ADMIN_USERNAME || 'admin';
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@rudraksha.local';
    const password = process.env.SEED_ADMIN_PASSWORD;
    const name = process.env.SEED_ADMIN_NAME || 'Admin';

    if (!password || String(password).trim().length < 8) {
      console.warn('SEED_ADMIN enabled but SEED_ADMIN_PASSWORD is missing/weak. Skipping admin seed.');
      return;
    }

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) return;

    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const hash = await bcrypt.hash(password, await bcrypt.genSalt(rounds));

    await User.create({
      name,
      username,
      email,
      password: hash,
      role: 'admin',
      status: 'active',
    });

    console.log(`Seeded admin user: username="${username}"`);
  } catch (err) {
    console.error('Failed to seed admin user:', err?.message || err);
  }
};
