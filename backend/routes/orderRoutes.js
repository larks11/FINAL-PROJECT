import express from 'express';
const router = express.Router();
import {
  addOrderItems,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  prepareOrder,
  pickupOrder,
  cancelOrder,
  getOrders,
  deleteOrder,
  archiveOrder,
  updateOrderETA,  // ✅ NEW
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders);
router.route('/mine').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById).delete(protect, admin, deleteOrder);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/cancel').put(protect, cancelOrder);
router.route('/:id/prepare').put(protect, admin, prepareOrder);
router.route('/:id/pickup').put(protect, admin, pickupOrder);
router.route('/:id/archive').put(protect, admin, archiveOrder);
router.route('/:id/eta').put(protect, admin, updateOrderETA);  // ✅ NEW

export default router;