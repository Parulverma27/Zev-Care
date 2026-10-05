import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/db.js';

const SubscriptionPlan = sequelize.define(
  'SubscriptionPlan',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    price: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    wallet_credit: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    validity_months: {
      type: DataTypes.INTEGER,
      defaultValue: 12,
    },
    applicable_services: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    service_limits: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    features_json: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    preventive_visits_count: {
      type: DataTypes.INTEGER,
      defaultValue: 2,
    },
    labor_coverage_percent: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
    },
    parts_coverage_cap: {
      type: DataTypes.DOUBLE,
      defaultValue: 15000.0,
    },
    priority_sla_hours: {
      type: DataTypes.INTEGER,
      defaultValue: 4,
    },
    tagline: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_recommended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'ACTIVE',
    },
  },
  {
    tableName: 'subscription_plans',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default SubscriptionPlan;
