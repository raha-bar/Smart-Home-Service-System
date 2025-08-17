// backend/models/review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }, // optional: link the booking used for validation
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 2000 },
    status:  { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  },
  { timestamps: true }
);

// Prevent multiple reviews for the same service by the same user
reviewSchema.index({ user: 1, service: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
