// backend/models/invoice.js
import mongoose from 'mongoose';

function genInvoiceNumber() {
  const d = new Date();
  const ymd = d.toISOString().slice(0,10).replace(/-/g,''); // YYYYMMDD
  const rand = String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
  return `INV-${ymd}-${rand}`;
}

const invoiceSchema = new mongoose.Schema(
  {
    number:    { type: String, unique: true, index: true },
    booking:   { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },     // customer
    provider:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },                      // assigned provider
    service:   { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },

    currency:  { type: String, default: 'USD' },
    subtotal:  { type: Number, required: true, min: 0 },
    taxPct:    { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, required: true, min: 0 },
    total:     { type: Number, required: true, min: 0 },

    status:    { type: String, enum: ['unpaid','paid','void'], default: 'unpaid', index: true },
    issuedAt:  { type: Date, default: Date.now },
    paidAt:    { type: Date },
    notes:     { type: String, trim: true, maxlength: 2000 },

    paymentTrxId: { type: String } // optional record of external tx
  },
  { timestamps: true }
);

invoiceSchema.pre('validate', function(next) {
  if (!this.number) this.number = genInvoiceNumber();
  if (this.taxAmount == null) this.taxAmount = +(this.subtotal * (this.taxPct/100)).toFixed(2);
  if (this.total == null) this.total = +(this.subtotal + this.taxAmount).toFixed(2);
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
