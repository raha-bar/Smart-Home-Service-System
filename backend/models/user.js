const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  address: String,
  role: { type: String, enum: ['user', 'provider', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false }
});
module.exports = mongoose.model('User', userSchema);