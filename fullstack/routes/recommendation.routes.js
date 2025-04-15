import express from "express"
import {
  getPersonalizedRecommendations,
  getProductBasedRecommendations,
  getTrendingProductsEndpoint,
} from "../controllers/recommendation.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.get("/personalized", protect, getPersonalizedRecommendations)
router.get("/product/:id", getProductBasedRecommendations)
router.get("/trending", getTrendingProductsEndpoint)

export default router

