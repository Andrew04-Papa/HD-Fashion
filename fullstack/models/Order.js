import { DataTypes } from "sequelize"
import sequelize from "../config/db.js"

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      references: {
        model: "Users",
        key: "id",
      },
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "processing", "shipped", "delivered", "cancelled"),
      defaultValue: "pending",
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    shipping: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    shippingAddressId: {
      type: DataTypes.UUID,
      references: {
        model: "Addresses",
        key: "id",
      },
    },
    billingAddressId: {
      type: DataTypes.UUID,
      references: {
        model: "Addresses",
        key: "id",
      },
    },
    paymentMethod: {
      type: DataTypes.STRING,
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    paidAt: {
      type: DataTypes.DATE,
    },
    isShipped: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    shippedAt: {
      type: DataTypes.DATE,
    },
    isDelivered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deliveredAt: {
      type: DataTypes.DATE,
    },
    trackingNumber: {
      type: DataTypes.STRING,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    paymentResultId: {
      type: DataTypes.STRING,
    },
    paymentResultStatus: {
      type: DataTypes.STRING,
    },
    paymentResultUpdateTime: {
      type: DataTypes.STRING,
    },
    paymentResultEmail: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: true,
  },
)

export default Order

