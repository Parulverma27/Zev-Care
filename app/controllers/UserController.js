/**
 * User Controller (C)
 * HTTP request/response only — delegates to Service layer.
 */

import userService from '../services/UserService.js';
import { parseUserListQuery } from '../http/requests/UserListRequest.js';
import ApiResponse from '../http/responses/ApiResponse.js';

export class UserController {
  async index(req, res, next) {
    try {
      const query = parseUserListQuery(req);
      const result = await userService.listUsers({
        limit: query.limit,
        offset: query.offset,
        search: query.search,
      });
      ApiResponse.ok(res, result.users, {
        total: result.total,
        page: query.page,
        per_page: query.perPage,
      });
    } catch (err) {
      next(err);
    }
  }

  async show(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) return ApiResponse.notFound(res, 'User not found');
      ApiResponse.ok(res, user);
    } catch (err) {
      next(err);
    }
  }

  async store(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      ApiResponse.created(res, user);
    } catch (err) {
      if (err.code === 'EMAIL_EXISTS') {
        return ApiResponse.validationError(res, err.message);
      }
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      if (!user) return ApiResponse.notFound(res, 'User not found');
      ApiResponse.ok(res, user);
    } catch (err) {
      if (err.code === 'EMAIL_EXISTS') {
        return ApiResponse.validationError(res, err.message);
      }
      next(err);
    }
  }

  async destroy(req, res, next) {
    try {
      const deleted = await userService.deleteUser(req.params.id);
      if (!deleted) return ApiResponse.notFound(res, 'User not found');
      ApiResponse.message(res, 'User deleted');
    } catch (err) {
      next(err);
    }
  }
}

export default new UserController();
