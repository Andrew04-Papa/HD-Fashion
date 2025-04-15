import asyncHandler from "express-async-handler"
import { Product, ProductSize, ProductColor, UserMeasurement } from "../models/index.js"

// @desc    Get size recommendation for a product
// @route   POST /api/size/recommend
// @access  Private
export const getSizeRecommendation = asyncHandler(async (req, res) => {
  const { productId, colorId } = req.body

  // Get user measurements
  const userMeasurement = await UserMeasurement.findOne({
    where: { userId: req.user.id },
  })

  if (!userMeasurement) {
    res.status(400)
    throw new Error("Please add your measurements first")
  }

  // Get product details
  const product = await Product.findByPk(productId, {
    include: [
      {
        model: ProductColor,
        as: "colors",
        where: { id: colorId },
        include: [
          {
            model: ProductSize,
            as: "sizes",
          },
        ],
      },
    ],
  })

  if (!product) {
    res.status(404)
    throw new Error("Product not found")
  }

  // Get available sizes for the product
  const availableSizes = product.colors[0].sizes

  // Implement size recommendation algorithm
  const recommendedSize = recommendSizeBasedOnMeasurements(availableSizes, userMeasurement, product.category)

  res.status(200).json({
    recommendedSize,
    availableSizes,
    userMeasurement,
  })
})

// @desc    Save user measurements
// @route   POST /api/size/measurements
// @access  Private
export const saveUserMeasurements = asyncHandler(async (req, res) => {
  const { height, weight, bust, waist, hips, inseam, shoulderWidth, armLength, gender } = req.body

  // Check if user already has measurements
  let userMeasurement = await UserMeasurement.findOne({
    where: { userId: req.user.id },
  })

  if (userMeasurement) {
    // Update existing measurements
    userMeasurement.height = height || userMeasurement.height
    userMeasurement.weight = weight || userMeasurement.weight
    userMeasurement.bust = bust || userMeasurement.bust
    userMeasurement.waist = waist || userMeasurement.waist
    userMeasurement.hips = hips || userMeasurement.hips
    userMeasurement.inseam = inseam || userMeasurement.inseam
    userMeasurement.shoulderWidth = shoulderWidth || userMeasurement.shoulderWidth
    userMeasurement.armLength = armLength || userMeasurement.armLength
    userMeasurement.gender = gender || userMeasurement.gender

    await userMeasurement.save()
  } else {
    // Create new measurements
    userMeasurement = await UserMeasurement.create({
      userId: req.user.id,
      height,
      weight,
      bust,
      waist,
      hips,
      inseam,
      shoulderWidth,
      armLength,
      gender,
    })
  }

  res.status(200).json(userMeasurement)
})

// Helper function to recommend size based on measurements
const recommendSizeBasedOnMeasurements = (availableSizes, userMeasurement, category) => {
  // Different algorithms based on product category
  switch (category) {
    case "tops":
      return recommendTopSize(availableSizes, userMeasurement)
    case "bottoms":
      return recommendBottomSize(availableSizes, userMeasurement)
    case "dresses":
      return recommendDressSize(availableSizes, userMeasurement)
    default:
      return recommendGeneralSize(availableSizes, userMeasurement)
  }
}

const recommendTopSize = (availableSizes, userMeasurement) => {
  // Algorithm for tops based on bust, shoulder width, and weight
  // This is a simplified example - real implementation would be more complex
  const { bust, shoulderWidth, gender } = userMeasurement

  // Size chart for tops (simplified)
  const sizeChart = {
    male: {
      XS: { bustMin: 0, bustMax: 86, shoulderMin: 0, shoulderMax: 40 },
      S: { bustMin: 86, bustMax: 94, shoulderMin: 40, shoulderMax: 43 },
      M: { bustMin: 94, bustMax: 102, shoulderMin: 43, shoulderMax: 46 },
      L: { bustMin: 102, bustMax: 110, shoulderMin: 46, shoulderMax: 49 },
      XL: { bustMin: 110, bustMax: 118, shoulderMin: 49, shoulderMax: 52 },
      XXL: { bustMin: 118, bustMax: 999, shoulderMin: 52, shoulderMax: 999 },
    },
    female: {
      XS: { bustMin: 0, bustMax: 82, shoulderMin: 0, shoulderMax: 37 },
      S: { bustMin: 82, bustMax: 87, shoulderMin: 37, shoulderMax: 39 },
      M: { bustMin: 87, bustMax: 92, shoulderMin: 39, shoulderMax: 41 },
      L: { bustMin: 92, bustMax: 97, shoulderMin: 41, shoulderMax: 43 },
      XL: { bustMin: 97, bustMax: 107, shoulderMin: 43, shoulderMax: 46 },
      XXL: { bustMin: 107, bustMax: 999, shoulderMin: 46, shoulderMax: 999 },
    },
  }

  const genderChart = sizeChart[gender] || sizeChart.female

  // Find the right size based on bust measurement
  let recommendedSize = null
  for (const [size, range] of Object.entries(genderChart)) {
    if (bust >= range.bustMin && bust < range.bustMax) {
      recommendedSize = size
      break
    }
  }

  // Filter available sizes
  const availableSizeNames = availableSizes.map((size) => size.name)
  if (recommendedSize && availableSizeNames.includes(recommendedSize)) {
    return recommendedSize
  } else {
    // Find closest available size
    return findClosestSize(recommendedSize, availableSizeNames)
  }
}

const recommendBottomSize = (availableSizes, userMeasurement) => {
  // Algorithm for bottoms based on waist, hips, and inseam
  // Similar implementation as recommendTopSize
  const { waist, hips, gender } = userMeasurement

  // Size chart for bottoms (simplified)
  const sizeChart = {
    male: {
      28: { waistMin: 0, waistMax: 73, hipsMin: 0, hipsMax: 88 },
      30: { waistMin: 73, waistMax: 78, hipsMin: 88, hipsMax: 93 },
      32: { waistMin: 78, waistMax: 83, hipsMin: 93, hipsMax: 98 },
      34: { waistMin: 83, waistMax: 88, hipsMin: 98, hipsMax: 103 },
      36: { waistMin: 88, waistMax: 93, hipsMin: 103, hipsMax: 108 },
      38: { waistMin: 93, waistMax: 999, hipsMin: 108, hipsMax: 999 },
    },
    female: {
      XS: { waistMin: 0, waistMax: 64, hipsMin: 0, hipsMax: 89 },
      S: { waistMin: 64, waistMax: 69, hipsMin: 89, hipsMax: 94 },
      M: { waistMin: 69, waistMax: 74, hipsMin: 94, hipsMax: 99 },
      L: { waistMin: 74, waistMax: 79, hipsMin: 99, hipsMax: 104 },
      XL: { waistMin: 79, waistMax: 84, hipsMin: 104, hipsMax: 109 },
      XXL: { waistMin: 84, waistMax: 999, hipsMin: 109, hipsMax: 999 },
    },
  }

  const genderChart = sizeChart[gender] || sizeChart.female

  // Find the right size based on waist measurement
  let recommendedSize = null
  for (const [size, range] of Object.entries(genderChart)) {
    if (waist >= range.waistMin && waist < range.waistMax) {
      recommendedSize = size
      break
    }
  }

  // Filter available sizes
  const availableSizeNames = availableSizes.map((size) => size.name)
  if (recommendedSize && availableSizeNames.includes(recommendedSize)) {
    return recommendedSize
  } else {
    // Find closest available size
    return findClosestSize(recommendedSize, availableSizeNames)
  }
}

const recommendDressSize = (availableSizes, userMeasurement) => {
  // Algorithm for dresses based on bust, waist, and hips
  // Combined approach from tops and bottoms
  const { bust, waist, hips, gender } = userMeasurement

  // For dresses, we'll use the most conservative size (largest) from bust, waist, and hips
  const bustSize = recommendTopSize(availableSizes, userMeasurement)
  const waistSize = recommendBottomSize(availableSizes, userMeasurement)

  // Convert sizes to numeric values for comparison
  const sizeValues = {
    XS: 1,
    S: 2,
    M: 3,
    L: 4,
    XL: 5,
    XXL: 6,
    28: 1,
    30: 2,
    32: 3,
    34: 4,
    36: 5,
    38: 6,
  }

  // Get the larger size
  const bustSizeValue = sizeValues[bustSize] || 3
  const waistSizeValue = sizeValues[waistSize] || 3

  const maxSizeValue = Math.max(bustSizeValue, waistSizeValue)

  // Convert back to size name
  const sizeNames = ["XS", "S", "M", "L", "XL", "XXL"]
  return sizeNames[maxSizeValue - 1] || "M"
}

const recommendGeneralSize = (availableSizes, userMeasurement) => {
  // Default algorithm based on height and weight
  const { height, weight, gender } = userMeasurement

  // BMI-based approach (simplified)
  const bmi = weight / (height / 100) ** 2

  let recommendedSize
  if (bmi < 18.5) {
    recommendedSize = "XS"
  } else if (bmi < 20) {
    recommendedSize = "S"
  } else if (bmi < 25) {
    recommendedSize = "M"
  } else if (bmi < 30) {
    recommendedSize = "L"
  } else if (bmi < 35) {
    recommendedSize = "XL"
  } else {
    recommendedSize = "XXL"
  }

  // Filter available sizes
  const availableSizeNames = availableSizes.map((size) => size.name)
  if (availableSizeNames.includes(recommendedSize)) {
    return recommendedSize
  } else {
    // Find closest available size
    return findClosestSize(recommendedSize, availableSizeNames)
  }
}

const findClosestSize = (recommendedSize, availableSizes) => {
  // Standard size order
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL"]
  const numericSizeOrder = ["28", "30", "32", "34", "36", "38", "40", "42"]

  // Check if we're dealing with numeric sizes
  if (numericSizeOrder.includes(recommendedSize)) {
    const index = numericSizeOrder.indexOf(recommendedSize)

    // Filter available sizes to only include numeric sizes
    const availableNumericSizes = availableSizes.filter((size) => numericSizeOrder.includes(size))

    if (availableNumericSizes.length === 0) {
      return availableSizes[0] // Return first available if no match
    }

    // Find closest size
    let closestSize = availableNumericSizes[0]
    let minDistance = Math.abs(numericSizeOrder.indexOf(closestSize) - index)

    for (const size of availableNumericSizes) {
      const distance = Math.abs(numericSizeOrder.indexOf(size) - index)
      if (distance < minDistance) {
        minDistance = distance
        closestSize = size
      }
    }

    return closestSize
  } else {
    // Handle letter sizes
    const index = sizeOrder.indexOf(recommendedSize)

    // Filter available sizes to only include letter sizes
    const availableLetterSizes = availableSizes.filter((size) => sizeOrder.includes(size))

    if (availableLetterSizes.length === 0) {
      return availableSizes[0] // Return first available if no match
    }

    // Find closest size
    let closestSize = availableLetterSizes[0]
    let minDistance = Math.abs(sizeOrder.indexOf(closestSize) - index)

    for (const size of availableLetterSizes) {
      const distance = Math.abs(sizeOrder.indexOf(size) - index)
      if (distance < minDistance) {
        minDistance = distance
        closestSize = size
      }
    }

    return closestSize
  }
}

