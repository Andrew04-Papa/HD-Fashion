import express from "express"
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeCart,
} from "../controllers/cart.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.route("/").get(getCart).delete(clearCart)

router.route("/items").post(addCartItem)

router.route("/items/:id").put(updateCartItem).delete(removeCartItem)

router.post("/merge", protect, mergeCart)

export default router

