import mongoose from 'mongoose';

const inventorySchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    productName: { type: String, required: true },
    supplier:    { type: String, default: '' },
    category:    { type: String, default: '' },
    sku:         { type: String, default: '' },

    // Stock
    stockQty:       { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },

    // Pricing
    retailPrice:    { type: Number, required: true, default: 0 },
    wholesalePrice: { type: Number, default: 0 },
    costPrice:      { type: Number, default: 0 },

    // Notes
    notes: { type: String, default: '' },

    // Soft delete
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Virtual: isLowStock
inventorySchema.virtual('isLowStock').get(function () {
  return this.stockQty <= this.lowStockThreshold && this.stockQty > 0;
});

// Virtual: isSoldOut
inventorySchema.virtual('isSoldOut').get(function () {
  return this.stockQty === 0;
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;