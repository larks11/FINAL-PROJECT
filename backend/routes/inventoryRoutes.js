import express from 'express';
const router = express.Router();
import {
  getInventory,
  getInventoryById,
  restockItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryStats,
  syncInventoryStock,
  getInventoryCategories,
  getStockHistory,
} from '../controllers/inventoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.get('/',            protect, admin, getInventory);
router.get('/stats',       protect, admin, getInventoryStats);
router.get('/categories',  protect, admin, getInventoryCategories);

router.route('/:id')
  .get(protect, admin, getInventoryById)
  .put(protect, admin, updateInventoryItem)
  .delete(protect, admin, deleteInventoryItem);

router.put('/:id/restock', protect, admin, restockItem);   // ✅ NEW
router.put('/:id/sync',    protect, admin, syncInventoryStock);
router.get('/:id/history', protect, admin, getStockHistory); // ✅ NEW

export default router;