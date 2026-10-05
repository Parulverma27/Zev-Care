import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/db.js';

const Provider = sequelize.define(
  'Provider',
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
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    categories_json: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    services_json: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 4.8,
    },
    total_jobs: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    earnings: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.0,
    },
    is_online: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'APPROVED',
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'providers',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Provider;
