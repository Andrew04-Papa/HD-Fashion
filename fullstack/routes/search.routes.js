import express from "express"
import { searchProducts, visualSearch } from "../controllers/search.controller.js"

const router = express.Router()

router.get("/", searchProducts)
router.post("/visual", visualSearch)

export default router

