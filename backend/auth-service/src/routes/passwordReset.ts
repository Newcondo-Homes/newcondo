// backend/auth-service/src/routes/passwordReset.ts
import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { body, param } from "express-validator";
import { validateRequest } from "@newcondo/backend-shared";
import { passwordResetController } from "../controllers/passwordResetController";

const router: ExpressRouter = Router();

// Request password reset
router.post(
  "/request",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
  ],
  validateRequest,
  passwordResetController.requestReset
);

// Verify reset token
router.get(
  "/verify/:token",
  [
    param("token")
      .isLength({ min: 32, max: 64 })
      .withMessage("Invalid reset token"),
  ],
  validateRequest,
  passwordResetController.verifyResetToken
);

// Reset password
router.post(
  "/reset",
  [
    body("token")
      .isLength({ min: 32, max: 64 })
      .withMessage("Invalid reset token"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        "Password must contain uppercase, lowercase, number and special character"
      ),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
  ],
  validateRequest,
  passwordResetController.resetPassword
);

export default router;
