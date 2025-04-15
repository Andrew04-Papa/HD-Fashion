import jwt from "jsonwebtoken"
import crypto from "crypto"
import User from "../models/User.js"
import { sendEmail } from "../utils/email.js"
import asyncHandler from "express-async-handler"

// Generate JWT token 21312rvdsfw
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  })
}

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body

    // Check if user already exists
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString("hex")

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      verificationToken,
    })

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
    await sendEmail({
      to: email,
      subject: "Verify Your Email",
      text: `Please verify your email by clicking the following link: ${verificationUrl}`,
      html: `<p>Please verify your email by clicking the following link: <a href="${verificationUrl}">Verify Email</a></p>`,
    })

    if (user) {
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        message: "Registration successful. Please verify your email.",
      })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Verify user email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params

    const user = await User.findOne({ verificationToken: token })
    if (!user) {
      return res.status(400).json({ message: "Invalid verification token" })
    }

    user.isVerified = true
    user.verificationToken = undefined
    await user.save()

    res.status(200).json({ message: "Email verified successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Update last login
    user.lastLogin = Date.now()
    await user.save()

    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: generateToken(user._id),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  // Find user by email
  const user = await User.findOne({ where: { email } })
  if (!user) {
    res.status(404)
    throw new Error("User not found")
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString("hex")

  // Hash token and set to resetPasswordToken field
  const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")

  // Set token expiry
  const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Update user
  user.resetPasswordToken = resetPasswordToken
  user.resetPasswordExpire = resetPasswordExpire
  await user.save()

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`

  try {
    // Send email
    await sendEmail({
      to: user.email,
      subject: "Password Reset",
      text: `You requested a password reset. Please go to: ${resetUrl}`,
      html: `<p>You requested a password reset.</p><p>Please click <a href="${resetUrl}">here</a> to reset your password.</p><p>If you didn't request this, please ignore this email.</p>`,
    })

    res.status(200).json({ message: "Email sent" })
  } catch (error) {
    user.resetPasswordToken = null
    user.resetPasswordExpire = null
    await user.save()

    res.status(500)
    throw new Error("Email could not be sent")
  }
})

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    // Hash the token from params
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex")

    // Find user with the token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" })
    }

    // Set new password
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    res.status(200).json({ message: "Password reset successful" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update user fields
    user.firstName = req.body.firstName || user.firstName
    user.lastName = req.body.lastName || user.lastName
    user.email = req.body.email || user.email
    user.phone = req.body.phone || user.phone
    user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth
    user.gender = req.body.gender || user.gender

    if (req.body.preferences) {
      user.preferences = {
        ...user.preferences,
        ...req.body.preferences,
      }
    }

    if (req.body.measurements) {
      user.measurements = {
        ...user.measurements,
        ...req.body.measurements,
      }
    }

    // Update password if provided
    if (req.body.password) {
      user.password = req.body.password
    }

    const updatedUser = await user.save()

    res.status(200).json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      preferences: updatedUser.preferences,
      measurements: updatedUser.measurements,
      token: generateToken(updatedUser._id),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

