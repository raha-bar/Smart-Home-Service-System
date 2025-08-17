// backend/models/providerProfile.js
import mongoose from 'mongoose';

const providerProfileSchema = new mongoose.Schema(
  {
    user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    displayName:   { type: String, trim: true, maxlength: 120 },
    phone:         { type: String, trim: true, maxlength: 40 },
    bio:           { type: String, trim: true, maxlength: 2000 },
    skills:        [{ type: String, trim: true, maxlength: 80 }],
    categories:    [{ type: String, trim: true, maxlength: 80 }],   // e.g., 'Cleaning', 'Plumbing'
    serviceAreas:  [{ type: String, trim: true, maxlength: 80 }],   // e.g., city/zone codes
    hourlyRate:    { type: Number, min: 0 },
    minFee:        { type: Number, min: 0 },

    isVerified:    { type: Boolean, default: false, index: true },
    verifiedAt:    { type: Date },

    // (optional future) aggregates from reviews
    ratingAvg:     { type: Number, min: 0, max: 5, default: 0 },
    ratingCount:   { type: Number, min: 0, default: 0 }
  },
  { timestamps: true }
);

providerProfileSchema.index({ categories: 1 });
providerProfileSchema.index({ skills: 1 });
providerProfileSchema.index({ serviceAreas: 1 });

const ProviderProfile = mongoose.model('ProviderProfile', providerProfileSchema);
export default ProviderProfile;
