import mongoose from 'mongoose';

const settingsSchema = mongoose.Schema(
  {
    shippingFees: {
      visayas: { type: Number, default: 80 },
      mindanao: { type: Number, default: 150 },
      luzon: { type: Number, default: 200 },
      default: { type: Number, default: 150 },
    },
    vatRate: { type: Number, default: 0 }, // percentage e.g. 12 = 12%
  },
  { timestamps: true }
);

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;