import express from "express"
import { chatWithAI, getStyleAdvice, getSizeRecommendation } from "../controllers/ai.controller.js"

const router = express.Router()

router.post("/chat", chatWithAI)
router.post("/style-advice", getStyleAdvice)
router.post("/size-recommendation", getSizeRecommendation)

export default router

