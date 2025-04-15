import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { body, validationResult } from "express-validator"

const router = express.Router()

// Middleware to validate request
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post(
  "/register",
  [
    body("name").not().isEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password } = req.body
      const db = req.db

      // Check if user already exists
      const userCheck = await db.request().input("email", email).query("SELECT * FROM Users WHERE Email = @email")

      if (userCheck.recordset.length > 0) {
        return res.status(400).json({ message: "User already exists" })
      }

      // Hash password
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      // Create user
      const result = await db
        .request()
        .input("name", name)
        .input("email", email)
        .input("password", hashedPassword)
        .input("isAdmin", 0)
        .query(`
          INSERT INTO Users (Name, Email, Password, IsAdmin)
          OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.Email, INSERTED.IsAdmin
          VALUES (@name, @email, @password, @isAdmin)
        `)

      const user = result.recordset[0]

      // Create JWT token
      const token = jwt.sign(
        { id: user.Id, email: user.Email, isAdmin: user.IsAdmin },
        process.env.JWT_SECRET || "your_secret_key",
        { expiresIn: "7d" },
      )

      // Set cookie
      res.cookie("auth-token", token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })

      // Return user data
      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.Id,
          name: user.Name,
          email: user.Email,
          isAdmin: user.IsAdmin,
        },
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body
      const db = req.db

      // Check if user exists
      const result = await db.request().input("email", email).query("SELECT * FROM Users WHERE Email = @email")

      if (result.recordset.length === 0) {
        return res.status(400).json({ message: "Invalid credentials" })
      }

      const user = result.recordset[0]

      // Check password
      const isMatch = await bcrypt.compare(password, user.Password)

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" })
      }

      // Create JWT token
      const token = jwt.sign(
        { id: user.Id, email: user.Email, isAdmin: user.IsAdmin },
        process.env.JWT_SECRET || "your_secret_key",
        { expiresIn: "7d" },
      )

      // Set cookie
      res.cookie("auth-token", token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })

      // Return user data
      res.json({
        message: "Login successful",
        user: {
          id: user.Id,
          name: user.Name,
          email: user.Email,
          isAdmin: user.IsAdmin,
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", async (req, res) => {
  try {
    // Get token from cookie
    const token = req.cookies["auth-token"]

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key")
    const db = req.db

    // Get user from database
    const result = await db
      .request()
      .input("id", decoded.id)
      .query("SELECT Id, Name, Email, IsAdmin FROM Users WHERE Id = @id")

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    const user = result.recordset[0]

    res.json({
      user: {
        id: user.Id,
        name: user.Name,
        email: user.Email,
        isAdmin: user.IsAdmin,
      },
    })
  } catch (error) {
    console.error("Get current user error:", error)
    res.status(401).json({ message: "Token is not valid" })
  }
})

// @route   POST /api/auth/logout
// @desc    Logout user / Clear cookie
// @access  Private
router.post("/logout", (req, res) => {
  res.clearCookie("auth-token")
  res.json({ message: "Logged out successfully" })
})

export default router

