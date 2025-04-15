import express from "express"
import {
  createOrder,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  updateOrderToPaid,
  updateOrderTracking,
  getOrderStats,
} from "../controllers/order.controller.js"
import { protect, admin } from "../middleware/auth.middleware.js"

const router = express.Router()

router.route("/").post(protect, createOrder).get(protect, admin, getOrders)

router.route("/myorders").get(protect, getMyOrders)

router.route("/stats").get(protect, admin, getOrderStats)

router.route("/:id").get(protect, getOrderById)

router.route("/:id/status").put(protect, admin, updateOrderStatus)

router.route("/:id/pay").put(protect, updateOrderToPaid)

router.route("/:id/tracking").put(protect, admin, updateOrderTracking)

export default router

