import { DataTypes } from "sequelize"
import sequelize from "../config/db.js"

const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Orders",
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    colorId: {
      type: DataTypes.UUID,
      references: {
        model: "ProductColors",
        key: "id",
      },
    },
    colorName: {
      type: DataTypes.STRING,
    },
    sizeId: {
      type: DataTypes.UUID,
      references: {
        model: "ProductSizes",
        key: "id",
      },
    },
    sizeName: {
      type: DataTypes.STRING,
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
    image: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: true,
  },
)

export default OrderItem

