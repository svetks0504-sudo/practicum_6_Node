import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: {args: [2, 50], msg: "Username must be 2-50 characters"}
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {msg: "Invalid email format"},
    },
  },
  age: {
    type: DataTypes.INTEGER,
    validate: {
      min: 18,
      max: 120,
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {args: [6, 100], msg: "Password must be at least 6 character"}
      }
    },
  },
  {
    timestamps: true,
});

export default User;
