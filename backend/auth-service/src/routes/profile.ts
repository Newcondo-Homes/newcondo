// backend/auth-service/src/routes/profile.ts
import { Router } from "express";
import multer from 'multer'
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getUserStats,
  updateEmail,
  updatePhone,
  getActivity,
} from "../controllers/profileController";
import { authenticateToken } from "../../../shared/src/middleware/auth";
import { rateLimiter } from "../../../shared/src/middleware/rateLimiter";
// import { authMiddleware } from '../middleware/authMiddleware';
// import { validateProfile } from '../validations/profileValidation';

const router = Router();

// Configure multer for image uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

// All profile routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get(
  "/",
  rateLimiter(30, 15), // 30 requests per 15 minutes
  getProfile
);

// PUT /api/auth/profile - Update user profile
router.put(
  "/",
  rateLimiter(10, 15), // 10 updates per 15 minutes
  updateProfile
);

// POST /api/auth/profile/change-password - Change password
router.post(
  "/change-password",
  rateLimiter(5, 15), // 5 password changes per 15 minutes
  changePassword
);

// Update user email (requires OTP verification)
router.put("/email", rateLimiter(10, 15), updateEmail);

// Update user phone (requires OTP verification)
router.put("/phone", rateLimiter(10, 15), updatePhone);

// Get user activity logs
router.get("/activity", getActivity);

// DELETE /api/auth/profile - Delete user account
router.delete(
  "/",
  rateLimiter(2, 60), // 2 deletion attempts per hour
  deleteAccount
);

// GET /api/auth/profile/stats - Get user statistics
router.get(
  "/stats",
  rateLimiter(20, 15), // 20 requests per 15 minutes
  getUserStats
);

export default router;
