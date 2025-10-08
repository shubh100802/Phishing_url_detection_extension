import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const seedAdmin = async () => {
  try {
    const existing = await User.findOne({ username: 'admin' });
    if (existing) return;

    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const hash = await bcrypt.hash('admin@123', await bcrypt.genSalt(rounds));

    await User.create({
      name: 'Shubham',
      username: 'admin',
      email: 'admin@rudraksha.local',
      password: hash,
      role: 'admin',
      status: 'active',
    });

    console.log('Seeded default admin user: username="admin"');
  } catch (err) {
    console.error('Failed to seed admin user:', err?.message || err);
  }
};
