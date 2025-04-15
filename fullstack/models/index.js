import User from "./User.js"
import Address from "./Address.js"
import Category from "./Category.js"
import Product from "./Product.js"
import ProductColor from "./ProductColor.js"
import ProductSize from "./ProductSize.js"
import ProductImage from "./ProductImage.js"
import Cart from "./Cart.js"
import CartItem from "./CartItem.js"
import Order from "./Order.js"
import OrderItem from "./OrderItem.js"
import Review from "./Review.js"
import UserMeasurement from "./UserMeasurement.js"
import Wishlist from "./Wishlist.js"

// User associations
User.hasMany(Address, { foreignKey: "userId", as: "addresses" })
User.hasOne(UserMeasurement, { foreignKey: "userId", as: "measurements" })
User.hasMany(Order, { foreignKey: "userId", as: "orders" })
User.hasOne(Cart, { foreignKey: "userId", as: "cart" })
User.hasMany(Review, { foreignKey: "userId", as: "reviews" })
User.hasMany(Wishlist, { foreignKey: "userId", as: "wishlist" })

// Address associations
Address.belongsTo(User, { foreignKey: "userId" })

// Category associations
Category.hasMany(Product, { foreignKey: "categoryId", as: "products" })
Category.belongsTo(Category, { foreignKey: "parentId", as: "parent" })
Category.hasMany(Category, { foreignKey: "parentId", as: "subcategories" })

// Product associations
Product.belongsTo(Category, { foreignKey: "categoryId" })
Product.hasMany(ProductColor, { foreignKey: "productId", as: "colors" })
Product.hasMany(Review, { foreignKey: "productId", as: "reviews" })
Product.hasMany(Wishlist, { foreignKey: "productId", as: "wishlists" })

// ProductColor associations
ProductColor.belongsTo(Product, { foreignKey: "productId" })
ProductColor.hasMany(ProductSize, { foreignKey: "colorId", as: "sizes" })
ProductColor.hasMany(ProductImage, { foreignKey: "colorId", as: "images" })

// ProductSize associations
ProductSize.belongsTo(ProductColor, { foreignKey: "colorId" })

// ProductImage associations
ProductImage.belongsTo(ProductColor, { foreignKey: "colorId" })

// ProductImage associations
ProductImage.belongsTo(ProductColor, { foreignKey: "colorId" })

// Cart associations
Cart.belongsTo(User, { foreignKey: "userId" })
Cart.hasMany(CartItem, { foreignKey: "cartId", as: "items" })

// CartItem associations
CartItem.belongsTo(Cart, { foreignKey: "cartId" })
CartItem.belongsTo(Product, { foreignKey: "productId" })
CartItem.belongsTo(ProductColor, { foreignKey: "colorId" })
CartItem.belongsTo(ProductSize, { foreignKey: "sizeId" })

// Order associations
Order.belongsTo(User, { foreignKey: "userId" })
Order.belongsTo(Address, { foreignKey: "shippingAddressId", as: "shippingAddress" })
Order.belongsTo(Address, { foreignKey: "billingAddressId", as: "billingAddress" })
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "orderItems" })

// OrderItem associations
OrderItem.belongsTo(Order, { foreignKey: "orderId" })
OrderItem.belongsTo(Product, { foreignKey: "productId" })
OrderItem.belongsTo(ProductColor, { foreignKey: "colorId" })
OrderItem.belongsTo(ProductSize, { foreignKey: "sizeId" })

// Review associations
Review.belongsTo(User, { foreignKey: "userId" })
Review.belongsTo(Product, { foreignKey: "productId" })

// UserMeasurement associations
UserMeasurement.belongsTo(User, { foreignKey: "userId" })

// Wishlist associations
Wishlist.belongsTo(User, { foreignKey: "userId" })
Wishlist.belongsTo(Product, { foreignKey: "productId" })

export {
  User,
  Address,
  Category,
  Product,
  ProductColor,
  ProductSize,
  ProductImage,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Review,
  UserMeasurement,
  Wishlist,
}

