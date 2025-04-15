import crypto from "crypto"
import asyncHandler from "express-async-handler"
import bcrypt from "bcryptjs"
import { executeQuery } from "../config/db.js"
import { generateToken } from "../utils/generateToken.js"
import { sendEmail } from "../utils/email.js"

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body

  // Check if user already exists
  const userExists = await executeQuery("SELECT * FROM dbo.Users WHERE Email = @email", { email })

  if (userExists.recordset.length > 0) {
    res.status(400)
    throw new Error("User already exists")
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(20).toString("hex")

  // Hash password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  // Create new user
  const result = await executeQuery(
    `
    INSERT INTO dbo.Users (FirstName, LastName, Email, Password, VerificationToken, IsVerified, Role, CreatedAt)
    OUTPUT INSERTED.Id, INSERTED.FirstName, INSERTED.LastName, INSERTED.Email, INSERTED.Role, INSERTED.IsVerified
    VALUES (@firstName, @lastName, @email, @password, @verificationToken, 0, 'user', GETDATE())
  `,
    {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      verificationToken,
    },
  )

  const user = result.recordset[0]

  // Create user measurements
  await executeQuery(
    `
    INSERT INTO dbo.UserMeasurements (UserId, CreatedAt)
    VALUES (@userId, GETDATE())
  `,
    {
      userId: user.Id,
    },
  )

  // Send verification email
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
  await sendEmail({
    to: email,
    subject: "Verify Your Email",
    text: `Please verify your email by clicking the following link: ${verificationUrl}`,
    html: `<p>Please verify your email by clicking the following link: <a href="${verificationUrl}">Verify Email</a></p>`,
  })

  res.status(201).json({
    id: user.Id,
    firstName: user.FirstName,
    lastName: user.LastName,
    email: user.Email,
    role: user.Role,
    token: generateToken(user.Id),
    message: "Registration successful. Please verify your email.",
  })
})

// @desc    Verify user email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params

  const result = await executeQuery("SELECT * FROM dbo.Users WHERE VerificationToken = @token", { token })

  if (result.recordset.length === 0) {
    res.status(400)
    throw new Error("Invalid verification token")
  }

  await executeQuery(
    `
    UPDATE dbo.Users
    SET IsVerified = 1, VerificationToken = NULL, UpdatedAt = GETDATE()
    WHERE VerificationToken = @token
  `,
    { token },
  )

  res.status(200).json({ message: "Email verified successfully" })
})

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Find user by email
  const result = await executeQuery("SELECT * FROM dbo.Users WHERE Email = @email", { email })

  if (result.recordset.length === 0) {
    res.status(401)
    throw new Error("Invalid email or password")
  }

  const user = result.recordset[0]

  // Check if password matches
  const isMatch = await bcrypt.compare(password, user.Password)
  if (!isMatch) {
    res.status(401)
    throw new Error("Invalid email or password")
  }

  // Update last login
  await executeQuery(
    `
    UPDATE dbo.Users
    SET LastLogin = GETDATE(), UpdatedAt = GETDATE()
    WHERE Id = @id
  `,
    { id: user.Id },
  )

  res.status(200).json({
    id: user.Id,
    firstName: user.FirstName,
    lastName: user.LastName,
    email: user.Email,
    role: user.Role,
    isVerified: user.IsVerified,
    token: generateToken(user.Id),
  })
})

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  // Find user by email
  const result = await executeQuery("SELECT * FROM dbo.Users WHERE Email = @email", { email })

  if (result.recordset.length === 0) {
    res.status(404)
    throw new Error("User not found")
  }

  const user = result.recordset[0]

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString("hex")

  // Hash token and set to resetPasswordToken field
  const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")

  // Set token expiry (10 minutes from now)
  const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000)

  // Update user
  await executeQuery(
    `
    UPDATE dbo.Users
    SET ResetPasswordToken = @resetPasswordToken, 
        ResetPasswordExpire = @resetPasswordExpire,
        UpdatedAt = GETDATE()
    WHERE Id = @id
  `,
    {
      resetPasswordToken,
      resetPasswordExpire,
      id: user.Id,
    },
  )

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`

  try {
    // Send email
    await sendEmail({
      to: user.Email,
      subject: "Password Reset",
      text: `You requested a password reset. Please go to: ${resetUrl}`,
      html: `<p>You requested a password reset.</p><p>Please click <a href="${resetUrl}">here</a> to reset your password.</p><p>If you didn't request this, please ignore this email.</p>`,
    })

    res.status(200).json({ message: "Email sent" })
  } catch (error) {
    // Reset token fields if email fails
    await executeQuery(
      `
      UPDATE dbo.Users
      SET ResetPasswordToken = NULL, 
          ResetPasswordExpire = NULL,
          UpdatedAt = GETDATE()
      WHERE Id = @id
    `,
      { id: user.Id },
    )

    res.status(500)
    throw new Error("Email could not be sent")
  }
})

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params
  const { password } = req.body

  // Hash the token from params
  const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex")

  // Find user with the token and check if token is still valid
  const result = await executeQuery(
    `
    SELECT * FROM dbo.Users 
    WHERE ResetPasswordToken = @resetPasswordToken 
    AND ResetPasswordExpire > GETDATE()
  `,
    { resetPasswordToken },
  )

  if (result.recordset.length === 0) {
    res.status(400)
    throw new Error("Invalid or expired token")
  }

  const user = result.recordset[0]

  // Hash new password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  // Update user with new password
  await executeQuery(
    `
    UPDATE dbo.Users
    SET Password = @password, 
        ResetPasswordToken = NULL, 
        ResetPasswordExpire = NULL,
        UpdatedAt = GETDATE()
    WHERE Id = @id
  `,
    {
      password: hashedPassword,
      id: user.Id,
    },
  )

  res.status(200).json({ message: "Password reset successful" })
})

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  // Get user with measurements
  const userResult = await executeQuery(
    `
    SELECT u.*, m.*
    FROM dbo.Users u
    LEFT JOIN dbo.UserMeasurements m ON u.Id = m.UserId
    WHERE u.Id = @id
  `,
    { id: req.user.id },
  )

  if (userResult.recordset.length === 0) {
    res.status(404)
    throw new Error("User not found")
  }

  const userData = userResult.recordset[0]

  res.status(200).json({
    id: userData.Id,
    firstName: userData.FirstName,
    lastName: userData.LastName,
    email: userData.Email,
    phone: userData.Phone,
    role: userData.Role,
    dateOfBirth: userData.DateOfBirth,
    gender: userData.Gender,
    profileImage: userData.ProfileImage,
    isVerified: userData.IsVerified,
    measurements: {
      height: userData.Height,
      weight: userData.Weight,
      bust: userData.Bust,
      waist: userData.Waist,
      hips: userData.Hips,
      inseam: userData.Inseam,
      shoulderWidth: userData.ShoulderWidth,
      armLength: userData.ArmLength,
    },
    createdAt: userData.CreatedAt,
  })
})

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const userResult = await executeQuery("SELECT * FROM dbo.Users WHERE Id = @id", { id: req.user.id })

  if (userResult.recordset.length === 0) {
    res.status(404)
    throw new Error("User not found")
  }

  const user = userResult.recordset[0]

  // Prepare update fields
  const firstName = req.body.firstName || user.FirstName
  const lastName = req.body.lastName || user.LastName
  const email = req.body.email || user.Email
  const phone = req.body.phone || user.Phone
  const dateOfBirth = req.body.dateOfBirth || user.DateOfBirth
  const gender = req.body.gender || user.Gender

  // Check if password is provided
  let passwordUpdate = ""
  const params = {
    id: req.user.id,
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    gender,
  }

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)
    passwordUpdate = ", Password = @password"
    params.password = hashedPassword
  }

  // Update user
  const updatedUserResult = await executeQuery(
    `
    UPDATE dbo.Users
    SET FirstName = @firstName,
        LastName = @lastName,
        Email = @email,
        Phone = @phone,
        DateOfBirth = @dateOfBirth,
        Gender = @gender${passwordUpdate},
        UpdatedAt = GETDATE()
    OUTPUT INSERTED.*
    WHERE Id = @id
  `,
    params,
  )

  const updatedUser = updatedUserResult.recordset[0]

  // Update measurements if provided
  if (req.body.measurements) {
    const measurementsResult = await executeQuery("SELECT * FROM dbo.UserMeasurements WHERE UserId = @userId", {
      userId: req.user.id,
    })

    if (measurementsResult.recordset.length > 0) {
      const measurements = req.body.measurements
      await executeQuery(
        `
        UPDATE dbo.UserMeasurements
        SET Height = ISNULL(@height, Height),
            Weight = ISNULL(@weight, Weight),
            Bust = ISNULL(@bust, Bust),
            Waist = ISNULL(@waist, Waist),
            Hips = ISNULL(@hips, Hips),
            Inseam = ISNULL(@inseam, Inseam),
            ShoulderWidth = ISNULL(@shoulderWidth, ShoulderWidth),
            ArmLength = ISNULL(@armLength, ArmLength),
            UpdatedAt = GETDATE()
        WHERE UserId = @userId
      `,
        {
          userId: req.user.id,
          height: measurements.height,
          weight: measurements.weight,
          bust: measurements.bust,
          waist: measurements.waist,
          hips: measurements.hips,
          inseam: measurements.inseam,
          shoulderWidth: measurements.shoulderWidth,
          armLength: measurements.armLength,
        },
      )
    }
  }

  res.status(200).json({
    id: updatedUser.Id,
    firstName: updatedUser.FirstName,
    lastName: updatedUser.LastName,
    email: updatedUser.Email,
    phone: updatedUser.Phone,
    role: updatedUser.Role,
    dateOfBirth: updatedUser.DateOfBirth,
    gender: updatedUser.Gender,
    profileImage: updatedUser.ProfileImage,
    isVerified: updatedUser.IsVerified,
    token: generateToken(updatedUser.Id),
  })
})

// @desc    Upload profile image
// @route   POST /api/auth/profile/image
// @access  Private
export const uploadProfileImage = asyncHandler(async (req, res) => {
  const userResult = await executeQuery("SELECT * FROM dbo.Users WHERE Id = @id", { id: req.user.id })

  if (userResult.recordset.length === 0) {
    res.status(404)
    throw new Error("User not found")
  }

  if (!req.file) {
    res.status(400)
    throw new Error("Please upload a file")
  }

  // Update profile image
  const profileImage = `/uploads/${req.file.filename}`
  await executeQuery(
    `
    UPDATE dbo.Users
    SET ProfileImage = @profileImage, UpdatedAt = GETDATE()
    WHERE Id = @id
  `,
    {
      profileImage,
      id: req.user.id,
    },
  )

  res.status(200).json({
    message: "Profile image uploaded successfully",
    profileImage: profileImage,
  })
})

export default {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
}