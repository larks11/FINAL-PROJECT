import express from 'express';
import {
  authUser,
  googleAuth,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  forgotPasswordRequest,
  getPasswordResetRequests,
  adminResetPassword,
  adminRejectPasswordReset,
  unlockUserAccount,
  getLockedAccounts,
  markNotificationRead,
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(registerUser).get(protect, admin, getUsers);
router.post('/auth', authUser);
router.post('/google', googleAuth);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPasswordRequest);

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.put('/notifications/read', protect, markNotificationRead);

// Admin routes
router.get('/admin/reset-requests', protect, admin, getPasswordResetRequests);
router.get('/admin/locked', protect, admin, getLockedAccounts);
router.put('/admin/:id/reset-password', protect, admin, adminResetPassword);
router.put('/admin/:id/reject-reset', protect, admin, adminRejectPasswordReset);
router.put('/admin/:id/unlock', protect, admin, unlockUserAccount);

router
  .route('/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);

export default router;