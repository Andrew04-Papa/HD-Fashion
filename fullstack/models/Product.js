import { DataTypes } from "sequelize"
import sequelize from "../config/db.js"

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    compareAtPrice: {
      type: DataTypes.DECIMAL(10, 2),
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Categories",
        key: "id",
      },
    },
    sku: {
      type: DataTypes.STRING,
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isNew: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isBestSeller: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    metaTitle: {
      type: DataTypes.STRING,
    },
    metaDescription: {
      type: DataTypes.TEXT,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
  },
)

export default Product

