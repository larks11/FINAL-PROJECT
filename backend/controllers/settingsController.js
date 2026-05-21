import asyncHandler from '../middleware/asyncHandler.js';
import Settings from '../models/settingsModel.js';

// GET settings (public)
const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({});
  if (!settings) {
    settings = await Settings.create({});
  }
  res.json(settings);
});

// UPDATE settings (admin only)
const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({});
  if (!settings) settings = new Settings({});

  const { shippingFees, vatRate } = req.body;

  if (shippingFees) {
    settings.shippingFees.visayas  = shippingFees.visayas  ?? settings.shippingFees.visayas;
    settings.shippingFees.mindanao = shippingFees.mindanao ?? settings.shippingFees.mindanao;
    settings.shippingFees.luzon    = shippingFees.luzon    ?? settings.shippingFees.luzon;
    settings.shippingFees.default  = shippingFees.default  ?? settings.shippingFees.default;
  }
  if (vatRate !== undefined) settings.vatRate = vatRate;

  const updated = await settings.save();
  res.json(updated);
});

export { getSettings, updateSettings };