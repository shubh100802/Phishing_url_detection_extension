import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

(async () => {
  try {
    await connectDB();

    const NEW_USERNAME = process.env.NEW_ADMIN_USERNAME || 'admin';
    const NEW_EMAIL = process.env.NEW_ADMIN_EMAIL || 'admin@rudraksha.local';
    const NEW_PASSWORD = process.env.NEW_ADMIN_PASSWORD;

    if (!NEW_PASSWORD || String(NEW_PASSWORD).trim().length < 8) {
      throw new Error('Set NEW_ADMIN_PASSWORD (min 8 chars) in environment before running resetAdmin.js');
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const hash = await bcrypt.hash(NEW_PASSWORD, await bcrypt.genSalt(rounds));

    const query = { $or: [{ email: NEW_EMAIL }, { username: NEW_USERNAME }, { role: 'admin' }] };
    let user = await User.findOne(query);

    if (!user) {
      user = await User.create({
        name: 'Admin',
        username: NEW_USERNAME,
        email: NEW_EMAIL,
        password: hash,
        role: 'admin',
        status: 'active',
      });
      console.log('Admin user did not exist. Created a new admin.');
    } else {
      user.username = NEW_USERNAME;
      user.email = NEW_EMAIL;
      user.password = hash;
      user.role = 'admin';
      user.status = 'active';
      await user.save();
      console.log('Existing admin updated successfully.');
    }

    console.log('Admin credentials reset for:', NEW_USERNAME);
    process.exit(0);
  } catch (err) {
    console.error('Failed to reset admin credentials:', err?.message || err);
    process.exit(1);
  }
})();
