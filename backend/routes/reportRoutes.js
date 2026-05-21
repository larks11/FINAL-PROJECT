import express from 'express';
const router = express.Router();
import { getSalesReport, getTopProducts } from '../controllers/reportController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/sales').get(protect, admin, getSalesReport);
router.route('/top-products').get(protect, admin, getTopProducts);

export default router;