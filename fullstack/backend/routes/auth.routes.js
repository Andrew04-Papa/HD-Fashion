import express from "express"
import {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
} from "../controllers/auth.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/register", register)
router.get("/verify-email/:token", verifyEmail)
router.post("/login", login)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", resetPassword)
router.route("/profile").get(protect, getUserProfile).put(protect, updateUserProfile)

export default router

