import asyncHandler from '../middleware/asyncHandler.js';
import Inventory from '../models/inventoryModel.js';
import Product from '../models/productModel.js';

// ─── GET ALL ──────────────────────────────────────────────────────────────────
const getInventory = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword
    ? {
        $or: [
          { productName: { $regex: req.query.keyword, $options: 'i' } },
          { supplier:    { $regex: req.query.keyword, $options: 'i' } },
          { category:    { $regex: req.query.keyword, $options: 'i' } },
          { sku:         { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};

  const filter = req.query.category
    ? { ...keyword, category: req.query.category, isActive: true }
    : { ...keyword, isActive: true };

  const items = await Inventory.find(filter)
    .populate('product', 'name image countInStock isArchived reservedStock')
    .sort({ createdAt: -1 });

  res.json(items);
});

// ─── GET BY ID ────────────────────────────────────────────────────────────────
const getInventoryById = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id).populate(
    'product', 'name image countInStock reservedStock'
  );
  if (item) res.json(item);
  else { res.status(404); throw new Error('Inventory item not found'); }
});

// ─── RESTOCK (was createInventoryItem — now only updates qty) ─────────────────
const restockItem = asyncHandler(async (req, res) => {
  const { qty, note, supplier } = req.body;
  const item = await Inventory.findById(req.params.id);

  if (!item) { res.status(404); throw new Error('Inventory item not found'); }
  if (!qty || Number(qty) <= 0) { res.status(400); throw new Error('Qty must be greater than 0'); }

  const addQty = Number(qty);
  item.stockQty += addQty;
  item.lastRestockDate = new Date();
  if (supplier) item.supplier = supplier;

  // Log history
  item.stockHistory.push({
    type: 'restock',
    qty:  addQty,
    note: note || `Restocked +${addQty}`,
  });

  await item.save();

  // Sync to Product
  await Product.findByIdAndUpdate(item.product, {
    countInStock: item.stockQty,
    isArchived:   false, // unarchive kung may stock na
  });

  res.json(item);
});

// ─── UPDATE INVENTORY ITEM (supplier, sku, prices, notes, threshold) ──────────
const updateInventoryItem = asyncHandler(async (req, res) => {
  const {
    supplier, sku, lowStockThreshold,
    retailPrice, wholesalePrice, costPrice, notes, stockQty,
  } = req.body;

  const item = await Inventory.findById(req.params.id);
  if (!item) { res.status(404); throw new Error('Inventory item not found'); }

  const oldQty = item.stockQty;

  item.supplier          = supplier          ?? item.supplier;
  item.sku               = sku               ?? item.sku;
  item.lowStockThreshold = lowStockThreshold !== undefined ? Number(lowStockThreshold) : item.lowStockThreshold;
  item.retailPrice       = retailPrice       !== undefined ? Number(retailPrice)       : item.retailPrice;
  item.wholesalePrice    = wholesalePrice    !== undefined ? Number(wholesalePrice)    : item.wholesalePrice;
  item.costPrice         = costPrice         !== undefined ? Number(costPrice)         : item.costPrice;
  item.notes             = notes             ?? item.notes;

  // Manual stock adjustment
  if (stockQty !== undefined && Number(stockQty) !== oldQty) {
    const diff = Number(stockQty) - oldQty;
    item.stockQty = Number(stockQty);
    item.stockHistory.push({
      type: diff > 0 ? 'restock' : 'adjustment',
      qty:  Math.abs(diff),
      note: `Manual adjustment: ${diff > 0 ? '+' : ''}${diff}`,
    });

    // Sync to Product
    await Product.findByIdAndUpdate(item.product, {
      countInStock: Number(stockQty),
      isArchived:   Number(stockQty) === 0 && (item.reservedStock || 0) === 0,
    });
  }

  const updated = await item.save();
  res.json(updated);
});

// ─── SOFT DELETE ──────────────────────────────────────────────────────────────
const deleteInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (item) {
    item.isActive = false;
    await item.save();
    res.json({ message: 'Inventory item removed' });
  } else {
    res.status(404);
    throw new Error('Inventory item not found');
  }
});

// ─── STATS ────────────────────────────────────────────────────────────────────
const getInventoryStats = asyncHandler(async (req, res) => {
  const items = await Inventory.find({ isActive: true });
  res.json({
    totalItems:       items.length,
    soldOutItems:     items.filter((i) => i.stockQty === 0).length,
    lowStockItems:    items.filter((i) => i.stockQty > 0 && i.stockQty <= i.lowStockThreshold).length,
    totalStockValue:  items.reduce((s, i) => s + i.stockQty * i.costPrice, 0),
    totalRetailValue: items.reduce((s, i) => s + i.stockQty * i.retailPrice, 0),
  });
});

// ─── SYNC STOCK FROM PRODUCT ──────────────────────────────────────────────────
const syncInventoryStock = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id).populate('product');
  if (!item || !item.product) {
    res.status(404);
    throw new Error('Inventory item or linked product not found');
  }
  item.stockQty = item.product.countInStock;
  item.reservedStock = item.product.reservedStock || 0;
  await item.save();
  res.json({ message: 'Stock synced', stockQty: item.stockQty });
});

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
const getInventoryCategories = asyncHandler(async (req, res) => {
  const cats = await Inventory.distinct('category', { isActive: true });
  res.json(cats.filter(Boolean));
});

// ─── STOCK HISTORY ────────────────────────────────────────────────────────────
const getStockHistory = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) { res.status(404); throw new Error('Inventory item not found'); }
  res.json(item.stockHistory.slice().reverse()); // newest first
});

export {
  getInventory,
  getInventoryById,
  restockItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryStats,
  syncInventoryStock,
  getInventoryCategories,
  getStockHistory,
};