/**
 * AdminController — handles admin authentication and sub-admin CRUD.
 */

import SubAdmin from '../models/SubAdmin.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

/** Super Admin credentials (hardcoded — single super admin account) */
const SUPER_ADMIN = {
  email: 'admin@zevotacare.com',
  password: 'admin123',
};

class AdminController {
  /**
   * POST /api/admin/login
   * Authenticate either super admin or sub-admin by email + password.
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check super admin first
      if (normalizedEmail === SUPER_ADMIN.email && password === SUPER_ADMIN.password) {
        return res.json({
          success: true,
          admin: {
            id: 'ADM-SUPER',
            name: 'Super Admin',
            email: SUPER_ADMIN.email,
            role: 'SUPER_ADMIN',
            assigned_categories: [],
            permissions: {
              can_dispatch_partners: true,
              can_approve_estimates: true,
              can_manage_catalog_rates: true,
              can_resolve_complaints: true,
            },
            status: 'ACTIVE',
          },
        });
      }

      // Check sub-admin table
      const subAdmin = await SubAdmin.findOne({ where: { email: normalizedEmail } });
      if (!subAdmin) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (subAdmin.status !== 'ACTIVE') {
        return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact super admin.' });
      }

      const validPassword = await verifyPassword(password, subAdmin.password_hash);
      if (!validPassword) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      return res.json({
        success: true,
        admin: {
          id: subAdmin.id,
          name: subAdmin.name,
          email: subAdmin.email,
          phone: subAdmin.phone,
          role: 'SUB_ADMIN',
          assigned_categories: subAdmin.assigned_categories,
          permissions: subAdmin.permissions,
          status: subAdmin.status,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/subadmins
   * List all sub-admins.
   */
  async listSubAdmins(req, res, next) {
    try {
      const subAdmins = await SubAdmin.findAll({ order: [['created_at', 'DESC']] });
      const result = subAdmins.map((sa) => ({
        id: sa.id,
        name: sa.name,
        email: sa.email,
        phone: sa.phone,
        role: 'SUB_ADMIN',
        assigned_categories: sa.assigned_categories,
        permissions: sa.permissions,
        status: sa.status,
        created_at: sa.created_at,
        updated_at: sa.updated_at,
      }));
      return res.json({ success: true, subAdmins: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/subadmins
   * Create a new sub-admin.
   */
  async createSubAdmin(req, res, next) {
    try {
      const { name, email, password, phone, assigned_categories, permissions } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Prevent using super admin email
      if (normalizedEmail === SUPER_ADMIN.email) {
        return res.status(400).json({ success: false, message: 'This email is reserved for the super admin.' });
      }

      // Check uniqueness
      const existing = await SubAdmin.findOne({ where: { email: normalizedEmail } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'A sub-admin with this email already exists.' });
      }

      const passwordHash = await hashPassword(password);

      const subAdmin = await SubAdmin.create({
        name: name.trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
        phone: phone || null,
        assigned_categories: assigned_categories || [],
        permissions: permissions || {
          can_dispatch_partners: true,
          can_approve_estimates: false,
          can_manage_catalog_rates: false,
          can_resolve_complaints: false,
        },
        status: 'ACTIVE',
      });

      return res.status(201).json({
        success: true,
        subAdmin: {
          id: subAdmin.id,
          name: subAdmin.name,
          email: subAdmin.email,
          phone: subAdmin.phone,
          role: 'SUB_ADMIN',
          assigned_categories: subAdmin.assigned_categories,
          permissions: subAdmin.permissions,
          status: subAdmin.status,
          created_at: subAdmin.created_at,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/admin/subadmins/:id
   * Update a sub-admin (name, email, phone, categories, permissions, and optionally password).
   */
  async updateSubAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const subAdmin = await SubAdmin.findByPk(id);
      if (!subAdmin) {
        return res.status(404).json({ success: false, message: 'Sub-admin not found.' });
      }

      const { name, email, phone, password, assigned_categories, permissions } = req.body;
      const updates = {};

      if (name) updates.name = name.trim();
      if (phone !== undefined) updates.phone = phone || null;
      if (assigned_categories) updates.assigned_categories = assigned_categories;
      if (permissions) updates.permissions = permissions;

      if (email) {
        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail === SUPER_ADMIN.email) {
          return res.status(400).json({ success: false, message: 'This email is reserved for the super admin.' });
        }
        if (normalizedEmail !== subAdmin.email) {
          const existing = await SubAdmin.findOne({ where: { email: normalizedEmail } });
          if (existing) {
            return res.status(409).json({ success: false, message: 'A sub-admin with this email already exists.' });
          }
          updates.email = normalizedEmail;
        }
      }

      // Optional password reset
      if (password) {
        updates.password_hash = await hashPassword(password);
      }

      await subAdmin.update(updates);

      return res.json({
        success: true,
        subAdmin: {
          id: subAdmin.id,
          name: subAdmin.name,
          email: subAdmin.email,
          phone: subAdmin.phone,
          role: 'SUB_ADMIN',
          assigned_categories: subAdmin.assigned_categories,
          permissions: subAdmin.permissions,
          status: subAdmin.status,
          updated_at: subAdmin.updated_at,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/admin/subadmins/:id
   * Delete a sub-admin.
   */
  async deleteSubAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const subAdmin = await SubAdmin.findByPk(id);
      if (!subAdmin) {
        return res.status(404).json({ success: false, message: 'Sub-admin not found.' });
      }
      await subAdmin.destroy();
      return res.json({ success: true, message: 'Sub-admin deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/subadmins/:id/status
   * Toggle sub-admin active/inactive status.
   */
  async toggleSubAdminStatus(req, res, next) {
    try {
      const { id } = req.params;
      const subAdmin = await SubAdmin.findByPk(id);
      if (!subAdmin) {
        return res.status(404).json({ success: false, message: 'Sub-admin not found.' });
      }

      const newStatus = subAdmin.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await subAdmin.update({ status: newStatus });

      return res.json({
        success: true,
        subAdmin: {
          id: subAdmin.id,
          name: subAdmin.name,
          email: subAdmin.email,
          status: newStatus,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new AdminController();

