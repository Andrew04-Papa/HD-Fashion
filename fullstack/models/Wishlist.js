import { DataTypes } from "sequelize"
import sequelize from "../config/db.js"

const Wishlist = sequelize.define(
  "Wishlist",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
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
  },
  {
    timestamps: true,
  },
)

export default Wishlist

