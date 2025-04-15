import { DataTypes } from "sequelize"
import sequelize from "../config/db.js"

const ProductColor = sequelize.define(
  "ProductColor",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Products",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    colorCode: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: true,
  },
)

export default ProductColor

