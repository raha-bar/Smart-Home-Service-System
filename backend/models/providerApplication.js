import mongoose from 'mongoose';

const providerApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phone: String,
  city: String,
  skills: String,
  experience: String,
  bio: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

const ProviderApplication = mongoose.model('ProviderApplication', providerApplicationSchema);
export default ProviderApplication;
