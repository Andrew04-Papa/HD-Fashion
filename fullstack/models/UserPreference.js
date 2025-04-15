import { DataTypes } from "sequelize"
import sequelize from "../config/db.js"

const UserPreference = sequelize.define(
  "UserPreference",
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
    sizePreference: {
      type: DataTypes.STRING,
    },
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    smsNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  },
)

export default UserPreference

