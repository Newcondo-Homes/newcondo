import { Router } from 'express';
import {
  generateShareableLink,
  getShareableLinkDetails,
  validateShareableLink,
  submitMarkingViaLink,
  revokeShareableLink,
  getActiveLinksByUser,
  uploadImagesViaLink,
} from '../controllers/shareableLinkController';
import { auth } from '../../../shared/src/middleware/auth';
import { validateShareableLinkAuth } from '../middleware/shareableLinkAuth';
import { checkRolePermission } from '../middleware/rolePermission';
import { validateLinkMarkingSubmission } from '../middleware/markingValidation';
import multer from 'multer';

const router = Router();

// Configure multer for image uploads via shareable link
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10, // Max 10 images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * @route   POST /api/shareable-links/:jobId/generate
 * @desc    Generate shareable link for a marking job
 * @access  Private (Job owner only)
 */
router.post(
  '/:jobId/generate',
  auth,
  checkRolePermission(['OWNER', 'AGENT']),
  generateShareableLink
);

/**
 * @route   GET /api/shareable-links/my-links
 * @desc    Get all active shareable links for user
 * @access  Private (Owner/Agent)
 */
router.get(
  '/my-links',
  auth,
  checkRolePermission(['OWNER', 'AGENT']),
  getActiveLinksByUser
);

/**
 * @route   GET /api/shareable-links/:token
 * @desc    Get shareable link details (public access with token)
 * @access  Public (with valid token)
 */
router.get(
  '/:token',
  validateShareableLinkAuth,
  getShareableLinkDetails
);

/**
 * @route   POST /api/shareable-links/:token/validate
 * @desc    Validate shareable link token
 * @access  Public (with valid token)
 */
router.post(
  '/:token/validate',
  validateShareableLink
);

/**
 * @route   POST /api/shareable-links/:token/submit
 * @desc    Submit marking via shareable link
 * @access  Public (with valid token)
 */
router.post(
  '/:token/submit',
  validateShareableLinkAuth,
  validateLinkMarkingSubmission,
  submitMarkingViaLink
);

/**
 * @route   POST /api/shareable-links/:token/images
 * @desc    Upload images via shareable link
 * @access  Public (with valid token)
 */
router.post(
  '/:token/images',
  validateShareableLinkAuth,
  upload.array('images', 10),
  uploadImagesViaLink
);

/**
 * @route   DELETE /api/shareable-links/:jobId/revoke
 * @desc    Revoke/delete shareable link for a job
 * @access  Private (Job owner only)
 */
router.delete(
  '/:jobId/revoke',
  auth,
  checkRolePermission(['OWNER', 'AGENT']),
  revokeShareableLink
);

export default router;