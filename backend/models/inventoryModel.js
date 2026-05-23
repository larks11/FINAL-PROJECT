import mongoose from 'mongoose';

const stockHistorySchema = new mongoose.Schema({
  type:      { type: String, enum: ['restock', 'sold', 'damaged', 'adjustment'], required: true },
  qty:       { type: Number, required: true },
  note:      { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const inventorySchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true, // ✅ Required na — connected sa Product palagi
    },
    productName:    { type: String, required: true },
    supplier:       { type: String, default: '' },
    category:       { type: String, default: '' },
    sku:            { type: String, default: '' },
    stockQty:       { type: Number, required: true, default: 0 },
    reservedStock:  { type: Number, default: 0 }, // ✅ NEW
    lowStockThreshold: { type: Number, default: 5 },
    retailPrice:    { type: Number, required: true, default: 0 },
    wholesalePrice: { type: Number, default: 0 },
    costPrice:      { type: Number, default: 0 },
    notes:          { type: String, default: '' },
    lastRestockDate: { type: Date, default: null }, // ✅ NEW
    stockHistory:   [stockHistorySchema],            // ✅ NEW
    isActive:       { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Virtuals
inventorySchema.virtual('availableStock').get(function () {
  return Math.max(0, this.stockQty - this.reservedStock);
});
inventorySchema.virtual('isLowStock').get(function () {
  return this.stockQty <= this.lowStockThreshold && this.stockQty > 0;
});
inventorySchema.virtual('isSoldOut').get(function () {
  return this.stockQty === 0;
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;