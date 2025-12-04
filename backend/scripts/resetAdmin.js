import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

// One-time maintenance script to reset admin credentials
// New credentials per request:
// username: admin@rudraksha.local
// password: Shubh@1008

dotenv.config();

(async () => {
  try {
    await connectDB();

    const NEW_USERNAME = 'admin@rudraksha.local';
    const NEW_PASSWORD = 'Shubh@1008';

    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const salt = await bcrypt.genSalt(rounds);
    const hash = await bcrypt.hash(NEW_PASSWORD, salt);

    const query = { $or: [ { email: 'admin@rudraksha.local' }, { username: 'admin' } ] };
    let user = await User.findOne(query);

    if (!user) {
      // Create admin if not found
      user = await User.create({
        name: 'Shubham',
        username: NEW_USERNAME,
        email: 'admin@rudraksha.local',
        password: hash,
        role: 'admin',
        status: 'active',
      });
      console.log('Admin user did not exist. Created a new admin.');
    } else {
      user.username = NEW_USERNAME;
      user.email = 'admin@rudraksha.local';
      user.password = hash;
      user.role = 'admin';
      user.status = 'active';
      await user.save();
      console.log('Existing admin updated successfully.');
    }

    console.log('New admin login:');
    console.log('  username:', NEW_USERNAME);
    console.log('  password:', NEW_PASSWORD);
    process.exit(0);
  } catch (err) {
    console.error('Failed to reset admin credentials:', err?.message || err);
    process.exit(1);
  }
})();
