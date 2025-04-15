import express from "express"
import {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductColor,
  addProductSize,
  uploadProductImages,
  createProductReview,
} from "../controllers/product.controller.js"
import { protect, admin } from "../middleware/auth.middleware.js"
import { upload } from "../middleware/upload.middleware.js"

const router = express.Router()

router.route("/").get(getProducts).post(protect, admin, createProduct)

router.route("/slug/:slug").get(getProductBySlug)

router.route("/:id").get(getProductById).put(protect, admin, updateProduct).delete(protect, admin, deleteProduct)

router.route("/:id/colors").post(protect, admin, addProductColor)
router.route("/colors/:colorId/sizes").post(protect, admin, addProductSize)
router.route("/colors/:colorId/images").post(protect, admin, upload.array("images", 5), uploadProductImages)

router.route("/:id/reviews").post(protect, createProductReview)

export default router

