import { DataTypes } from "sequelize"
import sequelize from "../config/db.js"

const CartItem = sequelize.define(
  "CartItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cartId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Carts",
        key: "id",
      },
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Products",
        key: "id",
      },
    },
    colorId: {
      type: DataTypes.UUID,
      references: {
        model: "ProductColors",
        key: "id",
      },
    },
    sizeId: {
      type: DataTypes.UUID,
      references: {
        model: "ProductSizes",
        key: "id",
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    timestamps: true,
  },
)

export default CartItem

