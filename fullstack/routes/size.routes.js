import express from "express"
import { getSizeRecommendation, saveUserMeasurements } from "../controllers/size.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/recommend", protect, getSizeRecommendation)
router.post("/measurements", protect, saveUserMeasurements)

export default router