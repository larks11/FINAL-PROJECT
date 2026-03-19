import express from 'express';
const router = express.Router();
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
  getProductsByCategory,
  checkUserOrder,
  requestProduct,
  getRequests,
  markRequestRead,
  getUnreadCount,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import checkObjectId from '../middleware/checkObjectId.js';

router.route('/').get(getProducts).post(protect, admin, createProduct);
router.get('/top', getTopProducts);
router.get('/category/:category', getProductsByCategory);
router.post('/request', protect, requestProduct);
router.get('/requests', protect, admin, getRequests);
router.get('/requests/unread-count', protect, admin, getUnreadCount);
router.put('/requests/:id/read', protect, admin, markRequestRead);
router.route('/:id/reviews').post(protect, checkObjectId, createProductReview);
router.get('/:id/check-order', protect, checkObjectId, checkUserOrder);
router
  .route('/:id')
  .get(checkObjectId, getProductById)
  .put(protect, admin, checkObjectId, updateProduct)
  .delete(protect, admin, checkObjectId, deleteProduct);

export default router;