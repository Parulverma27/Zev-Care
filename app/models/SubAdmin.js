import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/db.js';

const SubAdmin = sequelize.define(
  'SubAdmin',
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
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    assigned_categories: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      get() {
        const raw = this.getDataValue('assigned_categories');
        try {
          return JSON.parse(raw || '[]');
        } catch {
          return [];
        }
      },
      set(val) {
        this.setDataValue('assigned_categories', JSON.stringify(val || []));
      },
    },
    permissions: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '{}',
      get() {
        const raw = this.getDataValue('permissions');
        try {
          return JSON.parse(raw || '{}');
        } catch {
          return {};
        }
      },
      set(val) {
        this.setDataValue('permissions', JSON.stringify(val || {}));
      },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
  },
  {
    tableName: 'sub_admins',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default SubAdmin;

