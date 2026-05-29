import asyncHandler from '../middleware/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import User from '../models/userModel.js';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check if account is locked
  if (user.isLocked && user.lockUntil && user.lockUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    res.status(423);
    throw new Error(
      `Too many failed login attempts. Your account has been temporarily locked. Try again in ${minutesLeft} minute(s).`
    );
  }

  // Auto-unlock if lock duration has passed
  if (user.isLocked && user.lockUntil && user.lockUntil <= Date.now()) {
    user.isLocked = false;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();
  }

  const isMatch = await user.matchPassword(password);

  if (isMatch) {
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.isLocked = false;
    await user.save();

    generateToken(res, user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      notifications: user.notifications,
    });
  } else {
    user.loginAttempts += 1;

    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.isLocked = true;
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.notifications.push({
        message: 'Your account has been temporarily locked due to multiple failed login attempts.',
      });
      await user.save();
      res.status(423);
      throw new Error(
        'Too many failed login attempts. Your account has been temporarily locked. Try again in 15 minutes.'
      );
    }

    await user.save();
    const attemptsLeft = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
    res.status(401);
    throw new Error(
      `Invalid email or password. ${attemptsLeft} attempt(s) remaining before account lockout.`
    );
  }
});

const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const { name, email, sub: googleId } = ticket.getPayload();
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({ name, email, googleId, password: null });
  }

  generateToken(res, user._id);
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    notifications: user.notifications,
  });
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({ name, email, password });

  if (user) {
    generateToken(res, user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      notifications: user.notifications,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

const logoutUser = (req, res) => {
  res.clearCookie('jwt');
  res.status(200).json({ message: 'Logged out successfully' });
};

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      notifications: user.notifications,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      if (!req.body.oldPassword) {
        res.status(400);
        throw new Error('Please enter your current password');
      }
      if (user.password) {
        const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
        if (!isMatch) {
          res.status(401);
          throw new Error('Current password is incorrect');
        }
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      notifications: updatedUser.notifications,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    if (user.isAdmin) {
      res.status(400);
      throw new Error('Can not delete admin user');
    }
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = Boolean(req.body.isAdmin);
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// ─── FORGOT PASSWORD (User requests reset) ────────────────────────────────────
const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    res.status(400);
    throw new Error('Please provide both your username and email address');
  }

  // ✅ Find by email first
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('No account found with that email address');
  }

  // ✅ Validate name matches
  if (user.name.toLowerCase().trim() !== name.toLowerCase().trim()) {
    res.status(401);
    throw new Error('Username does not match the email address provided');
  }

  if (user.passwordResetRequest.status === 'pending') {
    res.status(400);
    throw new Error('You already have a pending password reset request. Please wait for admin approval.');
  }

  user.passwordResetRequest = {
    status: 'pending',
    requestedAt: new Date(),
    newPassword: null,
  };

  await user.save();
  res.json({ message: 'Password reset request submitted. Admin will review your request.' });
});

// ─── ADMIN: Get all password reset requests ───────────────────────────────────
const getPasswordResetRequests = asyncHandler(async (req, res) => {
  const users = await User.find({
    'passwordResetRequest.status': 'pending',
  }).select('-password');
  res.json(users);
});

// ─── ADMIN: Approve & reset password ─────────────────────────────────────────
const adminResetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.password = newPassword;
  user.passwordResetRequest = {
    status: 'approved',
    requestedAt: user.passwordResetRequest.requestedAt,
    newPassword: null,
  };

  user.notifications.push({
    message: 'Your password reset request has been approved. Your password has been changed by the admin.',
  });

  await user.save();
  res.json({ message: 'Password has been reset successfully' });
});

// ─── ADMIN: Reject password reset request ────────────────────────────────────
const adminRejectPasswordReset = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.passwordResetRequest = {
    status: 'rejected',
    requestedAt: user.passwordResetRequest.requestedAt,
    newPassword: null,
  };

  user.notifications.push({
    message: 'Your password reset request has been rejected. Please contact support.',
  });

  await user.save();
  res.json({ message: 'Password reset request rejected' });
});

// ─── ADMIN: Unlock account ────────────────────────────────────────────────────
const unlockUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isLocked = false;
  user.loginAttempts = 0;
  user.lockUntil = null;

  user.notifications.push({
    message: 'Your account has been unlocked by the admin. You can now log in.',
  });

  await user.save();
  res.json({ message: 'User account unlocked successfully' });
});

// ─── ADMIN: Get locked accounts ───────────────────────────────────────────────
const getLockedAccounts = asyncHandler(async (req, res) => {
  const lockedUsers = await User.find({ isLocked: true }).select('-password');
  res.json(lockedUsers);
});

// ─── USER: Mark notifications as read ────────────────────────────────────────
const markNotificationRead = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.notifications = user.notifications.map((n) => ({ ...n.toObject(), read: true }));
  await user.save();
  res.json({ message: 'Notifications marked as read' });
});

export {
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
};