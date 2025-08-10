import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/user.js';
import Service from '../models/service.js';

async function run() {
  await connectDB();
  await Promise.all([User.deleteMany({}), Service.deleteMany({})]);

  const [admin, provider, user] = await User.create([
    { name: 'Admin', email: 'admin@example.com', password: 'password', role: 'admin' },
    { name: 'Provider Pam', email: 'provider@example.com', password: 'password', role: 'provider' },
    { name: 'User Uma', email: 'user@example.com', password: 'password', role: 'user' }
  ]);

  await Service.create([
    { name: 'AC Repair', description: 'Fix and service air conditioners', price: 49.99, category: 'HVAC', provider: provider._id },
    { name: 'House Cleaning', description: 'Standard home cleaning', price: 29.99, category: 'Cleaning', provider: provider._id },
    { name: 'Plumbing', description: 'Leak fixes and installations', price: 59.0, category: 'Plumbing', provider: provider._id }
  ]);

  console.log('Seeded users and services');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});