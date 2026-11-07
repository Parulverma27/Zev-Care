/**
 * Migration: Create sub_admins table for category-scoped admin management.
 */

import { DataTypes } from 'sequelize';

export default {
  async up(queryInterface) {
    await queryInterface.createTable('sub_admins', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      assigned_categories: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '[]',
        comment: 'JSON array of category names assigned to this sub-admin',
      },
      permissions: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '{}',
        comment: 'JSON object with boolean permission flags',
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sub_admins');
  },
};

