import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/db.js';

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING(50),
      defaultValue: 'user',
    },
    wallet_balance: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.0,
    },
    subscription_plan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    subscription_status: {
      type: DataTypes.STRING(50),
      defaultValue: 'INACTIVE',
    },
    amc_contract_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    amc_start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    amc_expiry_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    amc_preventive_remaining: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    amc_parts_allowance_remaining: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.0,
    },
    property_video_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    property_verification_status: {
      type: DataTypes.STRING(50),
      defaultValue: 'PENDING',
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'ACTIVE',
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default User;
