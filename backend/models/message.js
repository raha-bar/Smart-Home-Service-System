// backend/models/message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    booking:  { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content:  { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

// Optional small index to speed up conversation fetches by booking
messageSchema.index({ booking: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
