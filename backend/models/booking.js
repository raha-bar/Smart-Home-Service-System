// backend/models/Booking.js
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service:    { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    provider:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // assigned by admin
    scheduledAt:{ type: Date, required: true },
    address:    { type: String, required: true },
    notes:      { type: String },
    payment: {
      method:   { type: String, enum: ['cash', 'online'], default: 'cash' },
      status:   { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
      trxId:    { type: String }
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'on_the_way', 'completed', 'cancelled'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ provider: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
