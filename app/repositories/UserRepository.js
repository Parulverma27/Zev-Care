/**
 * User Repository
 * All database queries for User entity (like Laravel Repository pattern).
 */

import User from '../models/User.js';
import { Op } from 'sequelize';

export class UserRepository {
  async findAll(options = {}) {
    const { limit = 50, offset = 0, search } = options;
    const where = {};
    if (search && search.trim()) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { email: { [Op.like]: `%${search.trim()}%` } },
      ];
    }
    return User.findAndCountAll({
      where,
      limit: Math.min(limit, 100),
      offset,
      order: [['id', 'ASC']],
    });
  }

  async findById(id) {
    return User.findByPk(id);
  }

  async findByEmail(email) {
    return User.findOne({ where: { email } });
  }

  async create(data) {
    return User.create(data);
  }

  async update(id, data) {
    const user = await User.findByPk(id);
    if (!user) return null;
    await user.update(data);
    return user;
  }

  async delete(id) {
    const user = await User.findByPk(id);
    if (!user) return false;
    await user.destroy();
    return true;
  }
}

export default new UserRepository();
