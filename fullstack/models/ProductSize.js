import { DataTypes } from "sequelize"
import sequelize from "../config/db.js"

const ProductSize = sequelize.define(
  "ProductSize",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    colorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "ProductColors",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
  },
)

export default ProductSize

