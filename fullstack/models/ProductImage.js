import { DataTypes } from "sequelize"
import sequelize from "../config/db.js"

const ProductImage = sequelize.define(
  "ProductImage",
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
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isMain: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
  },
)

export default ProductImage

