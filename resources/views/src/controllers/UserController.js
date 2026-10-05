/**
 * User Controller (C) — orchestrates View state and Service calls.
 * Views import this hook; they do not call UserService directly.
 */

import { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';
import User from '../models/User';

const PER_PAGE = 10;

export function useUserController() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [formUser, setFormUser] = useState(null);

  const fetchUsers = useCallback(async (pageNum = 1, search = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.list({
        page: pageNum,
        per_page: PER_PAGE,
        search: search || undefined,
      });
      setUsers((res.data || []).map(User.fromApi));
      setTotal(res.meta?.total ?? 0);
      setPage(res.meta?.page ?? pageNum);
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page);
  }, [page, fetchUsers]);

  const totalPages = Math.ceil(total / PER_PAGE) || 1;

  const openCreateForm = () => {
    setFormUser(User.empty());
    setFormVisible(true);
  };

  const openEditForm = (user) => {
    setFormUser(user);
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setFormUser(null);
  };

  const saveUser = async (data) => {
    if (User.isExisting(formUser)) {
      await userService.update(formUser.id, data);
    } else {
      await userService.create(data);
    }
    closeForm();
    await fetchUsers(page);
  };

  const removeUser = async (id) => {
    await userService.delete(id);
    await fetchUsers(page);
  };

  return {
    users,
    total,
    page,
    perPage: PER_PAGE,
    totalPages,
    loading,
    error,
    formVisible,
    formUser,
    setPage,
    openCreateForm,
    openEditForm,
    closeForm,
    saveUser,
    removeUser,
    refetch: () => fetchUsers(page),
  };
}

export default useUserController;
