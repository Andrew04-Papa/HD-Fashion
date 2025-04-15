import { DataTypes } from "sequelize"
import sequelize from "../config/db.js"

const UserMeasurement = sequelize.define(
  "UserMeasurement",
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
    height: {
      type: DataTypes.FLOAT,
    },
    weight: {
      type: DataTypes.FLOAT,
    },
    bust: {
      type: DataTypes.FLOAT,
    },
    waist: {
      type: DataTypes.FLOAT,
    },
    hips: {
      type: DataTypes.FLOAT,
    },
    inseam: {
      type: DataTypes.FLOAT,
    },
    shoulderWidth: {
      type: DataTypes.FLOAT,
    },
    armLength: {
      type: DataTypes.FLOAT,
    },
  },
  {
    timestamps: true,
  },
)

export default UserMeasurement

