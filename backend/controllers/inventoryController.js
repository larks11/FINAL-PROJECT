import asyncHandler from '../middleware/asyncHandler.js';
import Inventory from '../models/inventoryModel.js';
import Product from '../models/productModel.js';

// @desc  Get all inventory items
// @route GET /api/inventory
// @access Admin
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
    .populate('product', 'name image countInStock isArchived')
    .sort({ createdAt: -1 });

  res.json(items);
});

// @desc  Get single inventory item
// @route GET /api/inventory/:id
// @access Admin
const getInventoryById = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id).populate(
    'product', 'name image countInStock'
  );
  if (item) {
    res.json(item);
  } else {
    res.status(404);
    throw new Error('Inventory item not found');
  }
});

// @desc  Create inventory item
// @route POST /api/inventory
// @access Admin
const createInventoryItem = asyncHandler(async (req, res) => {
  const {
    productId, productName, supplier, category, sku,
    stockQty, lowStockThreshold,
    retailPrice, wholesalePrice, costPrice, notes,
  } = req.body;

  if (!productName || retailPrice === undefined) {
    res.status(400);
    throw new Error('Product name and retail price are required');
  }

  const item = new Inventory({
    product:           productId || null,
    productName,
    supplier:          supplier || '',
    category:          category || '',
    sku:               sku || '',
    stockQty:          Number(stockQty) || 0,
    lowStockThreshold: Number(lowStockThreshold) || 5,
    retailPrice:       Number(retailPrice) || 0,
    wholesalePrice:    Number(wholesalePrice) || 0,
    costPrice:         Number(costPrice) || 0,
    notes:             notes || '',
  });

  const created = await item.save();

  // Sync stock to product if linked
  if (productId) {
    await Product.findByIdAndUpdate(productId, {
      countInStock: Number(stockQty) || 0,
    });
  }

  res.status(201).json(created);
});

// @desc  Update inventory item
// @route PUT /api/inventory/:id
// @access Admin
const updateInventoryItem = asyncHandler(async (req, res) => {
  const {
    productName, supplier, category, sku,
    stockQty, lowStockThreshold,
    retailPrice, wholesalePrice, costPrice, notes,
  } = req.body;

  const item = await Inventory.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Inventory item not found');
  }

  item.productName       = productName       ?? item.productName;
  item.supplier          = supplier          ?? item.supplier;
  item.category          = category          ?? item.category;
  item.sku               = sku               ?? item.sku;
  item.stockQty          = stockQty !== undefined ? Number(stockQty) : item.stockQty;
  item.lowStockThreshold = lowStockThreshold !== undefined ? Number(lowStockThreshold) : item.lowStockThreshold;
  item.retailPrice       = retailPrice       !== undefined ? Number(retailPrice) : item.retailPrice;
  item.wholesalePrice    = wholesalePrice    !== undefined ? Number(wholesalePrice) : item.wholesalePrice;
  item.costPrice         = costPrice         !== undefined ? Number(costPrice) : item.costPrice;
  item.notes             = notes             ?? item.notes;

  const updated = await item.save();

  // Sync stock to linked product
  if (item.product) {
    await Product.findByIdAndUpdate(item.product, {
      countInStock: item.stockQty,
      isArchived:   item.stockQty === 0,
    });
  }

  res.json(updated);
});

// @desc  Delete (soft) inventory item
// @route DELETE /api/inventory/:id
// @access Admin
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

// @desc  Get inventory summary stats
// @route GET /api/inventory/stats
// @access Admin
const getInventoryStats = asyncHandler(async (req, res) => {
  const items = await Inventory.find({ isActive: true });

  const totalItems     = items.length;
  const soldOutItems   = items.filter((i) => i.stockQty === 0).length;
  const lowStockItems  = items.filter(
    (i) => i.stockQty > 0 && i.stockQty <= i.lowStockThreshold
  ).length;
  const totalStockValue = items.reduce(
    (sum, i) => sum + i.stockQty * i.costPrice, 0
  );
  const totalRetailValue = items.reduce(
    (sum, i) => sum + i.stockQty * i.retailPrice, 0
  );

  res.json({
    totalItems,
    soldOutItems,
    lowStockItems,
    totalStockValue,
    totalRetailValue,
  });
});

// @desc  Sync inventory stock from product countInStock
// @route PUT /api/inventory/:id/sync
// @access Admin
const syncInventoryStock = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id).populate('product');
  if (!item || !item.product) {
    res.status(404);
    throw new Error('Inventory item or linked product not found');
  }

  item.stockQty = item.product.countInStock;
  await item.save();
  res.json({ message: 'Stock synced', stockQty: item.stockQty });
});

// @desc  Get all unique categories in inventory
// @route GET /api/inventory/categories
// @access Admin
const getInventoryCategories = asyncHandler(async (req, res) => {
  const cats = await Inventory.distinct('category', { isActive: true });
  res.json(cats.filter(Boolean));
});

export {
  getInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryStats,
  syncInventoryStock,
  getInventoryCategories,
};