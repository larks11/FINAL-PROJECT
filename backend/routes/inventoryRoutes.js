import express from 'express';
const router = express.Router();
import {
  getInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryStats,
  syncInventoryStock,
  getInventoryCategories,
} from '../controllers/inventoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/')
  .get(protect, admin, getInventory)
  .post(protect, admin, createInventoryItem);

router.get('/stats',      protect, admin, getInventoryStats);
router.get('/categories', protect, admin, getInventoryCategories);

router.route('/:id')
  .get(protect, admin, getInventoryById)
  .put(protect, admin, updateInventoryItem)
  .delete(protect, admin, deleteInventoryItem);

router.put('/:id/sync', protect, admin, syncInventoryStock);

export default router;