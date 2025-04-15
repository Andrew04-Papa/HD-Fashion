import asyncHandler from "express-async-handler"
import { v4 as uuidv4 } from "uuid"
import { Cart, CartItem, Product, ProductColor, ProductSize, ProductImage } from "../models/index.js"

// @desc    Get cart
// @route   GET /api/cart
// @access  Private
export const getCart = asyncHandler(async (req, res) => {
  let cart

  // If user is logged in, get their cart
  if (req.user) {
    cart = await Cart.findOne({
      where: { userId: req.user.id },
      include: [
        {
          model: CartItem,
          as: "items",
          include: [
            {
              model: Product,
              attributes: ["id", "name", "price", "compareAtPrice", "slug"],
            },
            {
              model: ProductColor,
              attributes: ["id", "name", "colorCode"],
              include: [
                {
                  model: ProductImage,
                  as: "images",
                  where: { isMain: true },
                  required: false,
                  limit: 1,
                },
              ],
            },
            {
              model: ProductSize,
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    })

    // If no cart exists, create one
    if (!cart) {
      cart = await Cart.create({
        userId: req.user.id,
      })
    }
  } else {
    // For guest users, use sessionId
    const { sessionId } = req.cookies

    if (!sessionId) {
      // If no sessionId, create a new cart
      const newSessionId = uuidv4()
      res.cookie("sessionId", newSessionId, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      })

      cart = await Cart.create({
        sessionId: newSessionId,
      })
    } else {
      // Find cart by sessionId
      cart = await Cart.findOne({
        where: { sessionId },
        include: [
          {
            model: CartItem,
            as: "items",
            include: [
              {
                model: Product,
                attributes: ["id", "name", "price", "compareAtPrice", "slug"],
              },
              {
                model: ProductColor,
                attributes: ["id", "name", "colorCode"],
                include: [
                  {
                    model: ProductImage,
                    as: "images",
                    where: { isMain: true },
                    required: false,
                    limit: 1,
                  },
                ],
              },
              {
                model: ProductSize,
                attributes: ["id", "name"],
              },
            ],
          },
        ],
      })

      // If no cart exists, create one
      if (!cart) {
        cart = await Cart.create({
          sessionId,
        })
      }
    }
  }

  // Calculate totals
  let totalItems = 0
  let totalPrice = 0

  if (cart.items && cart.items.length > 0) {
    totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0)
    totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  // Update cart totals
  cart.totalItems = totalItems
  cart.totalPrice = totalPrice
  await cart.save()

  res.status(200).json(cart)
})

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Public
export const addCartItem = asyncHandler(async (req, res) => {
  const { productId, colorId, sizeId, quantity } = req.body

  // Validate product exists
  const product = await Product.findByPk(productId)
  if (!product) {
    res.status(404)
    throw new Error("Product not found")
  }

  // Validate color exists
  if (colorId) {
    const color = await ProductColor.findOne({
      where: { id: colorId, productId },
    })
    if (!color) {
      res.status(404)
      throw new Error("Color not found for this product")
    }
  }

  // Validate size exists
  if (sizeId) {
    const size = await ProductSize.findOne({
      where: { id: sizeId, colorId },
    })
    if (!size) {
      res.status(404)
      throw new Error("Size not found for this color")
    }

    // Check if size is in stock
    if (size.quantity < quantity) {
      res.status(400)
      throw new Error("Not enough items in stock")
    }
  }

  let cart

  // If user is logged in, get their cart
  if (req.user) {
    cart = await Cart.findOne({ where: { userId: req.user.id } })

    // If no cart exists, create one
    if (!cart) {
      cart = await Cart.create({
        userId: req.user.id,
      })
    }
  } else {
    // For guest users, use sessionId
    const { sessionId } = req.cookies

    if (!sessionId) {
      // If no sessionId, create a new cart
      const newSessionId = uuidv4()
      res.cookie("sessionId", newSessionId, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      })

      cart = await Cart.create({
        sessionId: newSessionId,
      })
    } else {
      // Find cart by sessionId
      cart = await Cart.findOne({ where: { sessionId } })

      // If no cart exists, create one
      if (!cart) {
        cart = await Cart.create({
          sessionId,
        })
      }
    }
  }

  // Check if item already exists in cart
  let cartItem = await CartItem.findOne({
    where: {
      cartId: cart.id,
      productId,
      colorId: colorId || null,
      sizeId: sizeId || null,
    },
  })

  if (cartItem) {
    // Update quantity if item exists
    cartItem.quantity += quantity
    await cartItem.save()
  } else {
    // Create new cart item
    cartItem = await CartItem.create({
      cartId: cart.id,
      productId,
      colorId: colorId || null,
      sizeId: sizeId || null,
      quantity,
      price: product.price,
    })
  }

  // Update cart totals
  const cartItems = await CartItem.findAll({
    where: { cartId: cart.id },
    include: [
      {
        model: Product,
        attributes: ["price"],
      },
    ],
  })

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  cart.totalItems = totalItems
  cart.totalPrice = totalPrice
  await cart.save()

  // Get updated cart with items
  const updatedCart = await Cart.findByPk(cart.id, {
    include: [
      {
        model: CartItem,
        as: "items",
        include: [
          {
            model: Product,
            attributes: ["id", "name", "price", "compareAtPrice", "slug"],
          },
          {
            model: ProductColor,
            attributes: ["id", "name", "colorCode"],
            include: [
              {
                model: ProductImage,
                as: "images",
                where: { isMain: true },
                required: false,
                limit: 1,
              },
            ],
          },
          {
            model: ProductSize,
            attributes: ["id", "name"],
          },
        ],
      },
    ],
  })

  res.status(201).json(updatedCart)
})

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:id
// @access  Public
export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body

  // Validate quantity
  if (quantity < 1) {
    res.status(400)
    throw new Error("Quantity must be at least 1")
  }

  // Get cart item
  const cartItem = await CartItem.findByPk(req.params.id)
  if (!cartItem) {
    res.status(404)
    throw new Error("Cart item not found")
  }

  // Get cart
  const cart = await Cart.findByPk(cartItem.cartId)

  // Check if user owns this cart
  if (req.user && cart.userId && cart.userId !== req.user.id) {
    res.status(403)
    throw new Error("Not authorized to access this cart")
  }

  // If guest user, check sessionId
  if (!req.user && cart.sessionId !== req.cookies.sessionId) {
    res.status(403)
    throw new Error("Not authorized to access this cart")
  }

  // Update quantity
  cartItem.quantity = quantity
  await cartItem.save()

  // Update cart totals
  const cartItems = await CartItem.findAll({
    where: { cartId: cart.id },
  })

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  cart.totalItems = totalItems
  cart.totalPrice = totalPrice
  await cart.save()

  // Get updated cart with items
  const updatedCart = await Cart.findByPk(cart.id, {
    include: [
      {
        model: CartItem,
        as: "items",
        include: [
          {
            model: Product,
            attributes: ["id", "name", "price", "compareAtPrice", "slug"],
          },
          {
            model: ProductColor,
            attributes: ["id", "name", "colorCode"],
            include: [
              {
                model: ProductImage,
                as: "images",
                where: { isMain: true },
                required: false,
                limit: 1,
              },
            ],
          },
          {
            model: ProductSize,
            attributes: ["id", "name"],
          },
        ],
      },
    ],
  })

  res.status(200).json(updatedCart)
})

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:id
// @access  Public
export const removeCartItem = asyncHandler(async (req, res) => {
  // Get cart item
  const cartItem = await CartItem.findByPk(req.params.id)
  if (!cartItem) {
    res.status(404)
    throw new Error("Cart item not found")
  }

  // Get cart
  const cart = await Cart.findByPk(cartItem.cartId)

  // Check if user owns this cart
  if (req.user && cart.userId && cart.userId !== req.user.id) {
    res.status(403)
    throw new Error("Not authorized to access this cart")
  }

  // If guest user, check sessionId
  if (!req.user && cart.sessionId !== req.cookies.sessionId) {
    res.status(403)
    throw new Error("Not authorized to access this cart")
  }

  // Remove item
  await cartItem.destroy()

  // Update cart totals
  const cartItems = await CartItem.findAll({
    where: { cartId: cart.id },
  })

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  cart.totalItems = totalItems
  cart.totalPrice = totalPrice
  await cart.save()

  // Get updated cart with items
  const updatedCart = await Cart.findByPk(cart.id, {
    include: [
      {
        model: CartItem,
        as: "items",
        include: [
          {
            model: Product,
            attributes: ["id", "name", "price", "compareAtPrice", "slug"],
          },
          {
            model: ProductColor,
            attributes: ["id", "name", "colorCode"],
            include: [
              {
                model: ProductImage,
                as: "images",
                where: { isMain: true },
                required: false,
                limit: 1,
              },
            ],
          },
          {
            model: ProductSize,
            attributes: ["id", "name"],
          },
        ],
      },
    ],
  })

  res.status(200).json(updatedCart)
})

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Public
export const clearCart = asyncHandler(async (req, res) => {
  let cart

  // If user is logged in, get their cart
  if (req.user) {
    cart = await Cart.findOne({ where: { userId: req.user.id } })
  } else {
    // For guest users, use sessionId
    const { sessionId } = req.cookies
    if (sessionId) {
      cart = await Cart.findOne({ where: { sessionId } })
    }
  }

  if (!cart) {
    res.status(404)
    throw new Error("Cart not found")
  }

  // Remove all items
  await CartItem.destroy({ where: { cartId: cart.id } })

  // Update cart totals
  cart.totalItems = 0
  cart.totalPrice = 0
  await cart.save()

  res.status(200).json({ message: "Cart cleared" })
})

// @desc    Merge guest cart with user cart after login
// @route   POST /api/cart/merge
// @access  Private
export const mergeCart = asyncHandler(async (req, res) => {
  const { sessionId } = req.cookies

  if (!sessionId) {
    res.status(400)
    throw new Error("No guest cart to merge")
  }

  // Get guest cart
  const guestCart = await Cart.findOne({
    where: { sessionId },
    include: [
      {
        model: CartItem,
        as: "items",
      },
    ],
  })

  if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
    res.status(400)
    throw new Error("No guest cart items to merge")
  }

  // Get or create user cart
  let userCart = await Cart.findOne({ where: { userId: req.user.id } })
  if (!userCart) {
    userCart = await Cart.create({
      userId: req.user.id,
    })
  }

  // Merge items
  for (const guestItem of guestCart.items) {
    // Check if item already exists in user cart
    const userItem = await CartItem.findOne({
      where: {
        cartId: userCart.id,
        productId: guestItem.productId,
        colorId: guestItem.colorId,
        sizeId: guestItem.sizeId,
      },
    })

    if (userItem) {
      // Update quantity if item exists
      userItem.quantity += guestItem.quantity
      await userItem.save()
    } else {
      // Create new cart item
      await CartItem.create({
        cartId: userCart.id,
        productId: guestItem.productId,
        colorId: guestItem.colorId,
        sizeId: guestItem.sizeId,
        quantity: guestItem.quantity,
        price: guestItem.price,
      })
    }
  }

  // Update user cart totals
  const userCartItems = await CartItem.findAll({
    where: { cartId: userCart.id },
  })

  const totalItems = userCartItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = userCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  userCart.totalItems = totalItems
  userCart.totalPrice = totalPrice
  await userCart.save()

  // Delete guest cart
  await CartItem.destroy({ where: { cartId: guestCart.id } })
  await guestCart.destroy()

  // Clear sessionId cookie
  res.clearCookie("sessionId")

  // Get updated cart with items
  const updatedCart = await Cart.findByPk(userCart.id, {
    include: [
      {
        model: CartItem,
        as: "items",
        include: [
          {
            model: Product,
            attributes: ["id", "name", "price", "compareAtPrice", "slug"],
          },
          {
            model: ProductColor,
            attributes: ["id", "name", "colorCode"],
            include: [
              {
                model: ProductImage,
                as: "images",
                where: { isMain: true },
                required: false,
                limit: 1,
              },
            ],
          },
          {
            model: ProductSize,
            attributes: ["id", "name"],
          },
        ],
      },
    ],
  })

  res.status(200).json(updatedCart)
})

