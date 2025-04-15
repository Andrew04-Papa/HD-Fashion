import { DataTypes } from "sequelize"
import sequelize from "../config/db.js"

const Category = sequelize.define(
  "Category",
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
    image: {
      type: DataTypes.STRING,
    },
    parentId: {
      type: DataTypes.UUID,
      references: {
        model: "Categories",
        key: "id",
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    metaTitle: {
      type: DataTypes.STRING,
    },
    metaDescription: {
      type: DataTypes.TEXT,
    },
  },
  {
    timestamps: true,
  },
)

export default Category

