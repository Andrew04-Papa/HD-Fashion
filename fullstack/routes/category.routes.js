import express from "express"
import {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from "../controllers/category.controller.js"
import { protect, admin } from "../middleware/auth.middleware.js"
import { upload } from "../middleware/upload.middleware.js"

const router = express.Router()

router.route("/").get(getCategories).post(protect, admin, createCategory)

router.route("/slug/:slug").get(getCategoryBySlug)

router.route("/:id").get(getCategoryById).put(protect, admin, updateCategory).delete(protect, admin, deleteCategory)

router.route("/:id/image").post(protect, admin, upload.single("image"), uploadCategoryImage)

export default router

