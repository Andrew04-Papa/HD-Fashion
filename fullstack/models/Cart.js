import { DataTypes } from "sequelize"
import sequelize from "../config/db.js"

const Cart = sequelize.define(
  "Cart",
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
    sessionId: {
      type: DataTypes.STRING,
    },
    totalItems: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
  },
)

export default Cart

