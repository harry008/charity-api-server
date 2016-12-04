import mongoose, { Schema } from 'mongoose';

const DonationSchema = new Schema({
  donor: { type: Schema.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  donation_date: { type: Date, default: Date.now }
});

export default mongoose.model('Donation', DonationSchema);
