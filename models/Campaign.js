import mongoose, { Schema } from 'mongoose';
// import User from './User';

const CampaignSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  eventDate: { type: Date, default: Date.now },
  place: {
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    pin: { type: Number },
    state: { type: String, default: '' },
  },
  patients: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  doctors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model('Campaign', CampaignSchema);
