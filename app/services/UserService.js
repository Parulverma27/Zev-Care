/**
 * User Service
 * Business logic for User (like Laravel Service classes).
 */

import userRepository from '../repositories/UserRepository.js';

export class UserService {
  async listUsers(options = {}) {
    const { rows, count } = await userRepository.findAll(options);
    return { users: rows, total: count };
  }

  async getUserById(id) {
    return userRepository.findById(id);
  }

  async createUser(data) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      const err = new Error('Email already in use');
      err.code = 'EMAIL_EXISTS';
      throw err;
    }
    return userRepository.create(data);
  }

  async updateUser(id, data) {
    const user = await userRepository.findById(id);
    if (!user) return null;
    if (data.email && data.email !== user.email) {
      const existing = await userRepository.findByEmail(data.email);
      if (existing) {
        const err = new Error('Email already in use');
        err.code = 'EMAIL_EXISTS';
        throw err;
      }
    }
    return userRepository.update(id, data);
  }

  async deleteUser(id) {
    return userRepository.delete(id);
  }
}

export default new UserService();
