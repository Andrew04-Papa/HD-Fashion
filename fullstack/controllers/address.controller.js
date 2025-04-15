import asyncHandler from "express-async-handler"
import { Address } from "../models/index.js"

// @desc    Get user addresses
// @route   GET /api/addresses
// @access  Private
export const getUserAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.findAll({
    where: { userId: req.user.id },
    order: [
      ["isDefault", "DESC"],
      ["createdAt", "DESC"],
    ],
  })

  res.status(200).json(addresses)
})

// @desc    Get address by ID
// @route   GET /api/addresses/:id
// @access  Private
export const getAddressById = asyncHandler(async (req, res) => {
  const address = await Address.findByPk(req.params.id)

  if (!address) {
    res.status(404)
    throw new Error("Address not found")
  }

  // Check if user is authorized to view this address
  if (address.userId !== req.user.id) {
    res.status(403)
    throw new Error("Not authorized to view this address")
  }

  res.status(200).json(address)
})

// @desc    Create new address
// @route   POST /api/addresses
// @access  Private
export const createAddress = asyncHandler(async (req, res) => {
  const { street, city, state, zipCode, country, isDefault } = req.body

  // If this is the default address, unset any existing default
  if (isDefault) {
    await Address.update({ isDefault: false }, { where: { userId: req.user.id, isDefault: true } })
  }

  const address = await Address.create({
    userId: req.user.id,
    street,
    city,
    state,
    zipCode,
    country,
    isDefault: isDefault || false,
  })

  res.status(201).json(address)
})

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
export const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findByPk(req.params.id)

  if (!address) {
    res.status(404)
    throw new Error("Address not found")
  }

  // Check if user is authorized to update this address
  if (address.userId !== req.user.id) {
    res.status(403)
    throw new Error("Not authorized to update this address")
  }

  // If this is being set as default, unset any existing default
  if (req.body.isDefault && !address.isDefault) {
    await Address.update({ isDefault: false }, { where: { userId: req.user.id, isDefault: true } })
  }

  // Update address fields
  address.street = req.body.street || address.street
  address.city = req.body.city || address.city
  address.state = req.body.state || address.state
  address.zipCode = req.body.zipCode || address.zipCode
  address.country = req.body.country || address.country
  address.isDefault = req.body.isDefault !== undefined ? req.body.isDefault : address.isDefault

  const updatedAddress = await address.save()
  res.status(200).json(updatedAddress)
})

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findByPk(req.params.id)

  if (!address) {
    res.status(404)
    throw new Error("Address not found")
  }

  // Check if user is authorized to delete this address
  if (address.userId !== req.user.id) {
    res.status(403)
    throw new Error("Not authorized to delete this address")
  }

  await address.destroy()
  res.status(200).json({ message: "Address removed" })
})

