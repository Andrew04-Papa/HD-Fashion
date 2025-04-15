import express from "express"
import {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.route("/").get(protect, getUserAddresses).post(protect, createAddress)

router.route("/:id").get(protect, getAddressById).put(protect, updateAddress).delete(protect, deleteAddress)

export default router

