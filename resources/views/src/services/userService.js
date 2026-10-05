/**
 * User Service — API/data access for User (like backend Repository).
 */

import api from './ApiService';

export class UserService {
  list(params = {}) {
    return api.get('/users', { params }).then((res) => res.data);
  }

  get(id) {
    return api.get(`/users/${id}`).then((res) => res.data);
  }

  create(data) {
    return api.post('/users', data).then((res) => res.data);
  }

  update(id, data) {
    return api.put(`/users/${id}`, data).then((res) => res.data);
  }

  delete(id) {
    return api.delete(`/users/${id}`).then((res) => res.data);
  }
}

export default new UserService();
