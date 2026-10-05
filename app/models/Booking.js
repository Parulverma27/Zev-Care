import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/db.js';

const Booking = sequelize.define(
  'Booking',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    booking_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    provider_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    category_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sub_category_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    service_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    address_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    issue_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    issue_media_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    scheduled_date: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    scheduled_time: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(100),
      defaultValue: 'PENDING_ADMIN_REVIEW',
    },
    inspection_report: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    service_charge: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.0,
    },
    parts_charge: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.0,
    },
    labour_charge: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.0,
    },
    discount_amount: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.0,
    },
    total_bill: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.0,
    },
    bill_status: {
      type: DataTypes.STRING(50),
      defaultValue: 'UNPAID',
    },
    before_media_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    after_media_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    completion_otp: {
      type: DataTypes.STRING(10),
      defaultValue: '4829',
    },
    is_otp_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'bookings',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Booking;
