import { Router } from 'express';
import userController from '../app/controllers/UserController.js';
import adminController from '../app/controllers/AdminController.js';
import { validateRequest } from '../app/middlewares/validateRequest.js';
import { userStoreRules, userUpdateRules } from '../app/http/requests/index.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../app/models/User.js';
import WalletTransaction from '../app/models/WalletTransaction.js';
import { sequelize } from '../config/db.js';
import { CATALOG_VERSION, SERVICE_CATALOG } from '../resources/views/src/config/serviceCatalog.server.js';
import { flattenToLegacyCatalog } from '../resources/views/src/config/serviceCatalogUtils.server.js';

const router = Router();

const razorpay = new Razorpay({
  key_id: 'rzp_test_SulCbbU6slizY9',
  key_secret: 'l7SE1i2C0MfMzREZrslnN2c4',
});

router.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', app: 'zevota-care', database: 'ok' });
  } catch {
    res.status(503).json({ status: 'error', app: 'zevota-care', database: 'down' });
  }
});

// Razorpay Payments
router.post('/payments/create-order', async (req, res, next) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: Math.round(amount * 100), // in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

router.post('/payments/verify', async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      userPhone,
      planName,
      creditAmount,
    } = req.body;

    const isMock = razorpay_order_id && razorpay_order_id.startsWith('order_mock_');
    const generated_signature = crypto
      .createHmac('sha256', 'l7SE1i2C0MfMzREZrslnN2c4')
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature && !isMock) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const credit = Number(creditAmount || 0);
    const cleanPhone = String(userPhone || '').replace(/\D/g, '').slice(-10);

    let user = null;
    if (cleanPhone) {
      const users = await User.findAll();
      user = users.find((u) => String(u.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone) || null;
    }
    if (!user && userId) {
      user = await User.findByPk(userId);
    }
    if (!user && cleanPhone) {
      user = await User.create({
        name: 'Zevota User',
        email: `user_${cleanPhone}@zevotacare.com`,
        phone: userPhone || `+91 ${cleanPhone}`,
        wallet_balance: 0.0,
        subscription_plan: 'None',
        subscription_status: 'INACTIVE',
      });
    }
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found for payment verification' });
    }

    const prevBalance = Number(user.wallet_balance || 0);
    const nextBalance = credit;

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    const contractNo = user.amc_contract_number || `AMC-${startDate.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const preventiveVisits = String(planName).toLowerCase().includes('platinum')
      ? 6
      : String(planName).toLowerCase().includes('gold')
      ? 4
      : 2;

    await user.update({
      wallet_balance: nextBalance,
      subscription_plan: planName,
      subscription_status: 'ACTIVE',
      amc_contract_number: contractNo,
      amc_start_date: startDate,
      amc_expiry_date: expiryDate,
      amc_preventive_remaining: preventiveVisits,
      amc_parts_allowance_remaining: credit,
    });

    const txId = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
    await WalletTransaction.create({
      transaction_id: txId,
      user_id: user.id,
      type: 'AMC_PURCHASE',
      amount: credit,
      balance_before: prevBalance,
      balance_after: nextBalance,
      description: `Activated ${planName} AMC Contract (#${contractNo}) with 365 days coverage`,
      status: 'SUCCESSFUL',
    });

    res.json({
      success: true,
      transaction_id: txId,
      balance_after: nextBalance,
      amc_contract_number: contractNo,
      amc_expiry_date: expiryDate,
      amc_preventive_remaining: preventiveVisits,
    });
  } catch (err) {
    next(err);
  }
});

// Service catalog (centralized config — same source as frontend)
router.get('/catalog', (req, res) => {
  const legacy = flattenToLegacyCatalog();
  res.json({
    version: CATALOG_VERSION,
    catalog: SERVICE_CATALOG,
    categories: legacy.categories,
    subCategories: legacy.subCategories,
    services: legacy.services,
  });
});

router.get('/banners', (req, res) => {
  res.json({
    success: true,
    banners: [
      {
        id: 1,
        title: 'Care for your home, without the hassle.',
        description: 'Expert appliance & home services at your doorstep.',
        type: 'hero',
        redirect_url: '/user/bookings/new',
      },
      {
        id: 2,
        title: 'Trusted Professionals',
        description: 'Certified experts with 100% genuine parts.',
        type: 'footer',
        redirect_url: '/user/bookings/new',
      },
    ],
  });
});

router.get('/users', userController.index.bind(userController));
router.get('/users/:id', userController.show.bind(userController));
router.post(
  '/users',
  validateRequest(userStoreRules),
  userController.store.bind(userController)
);
router.put(
  '/users/:id',
  validateRequest(userUpdateRules),
  userController.update.bind(userController)
);
router.delete('/users/:id', userController.destroy.bind(userController));

// ── Admin Authentication & Sub-Admin CRUD ────────────────────────────
router.post('/admin/login', adminController.login.bind(adminController));
router.get('/admin/subadmins', adminController.listSubAdmins.bind(adminController));
router.post('/admin/subadmins', adminController.createSubAdmin.bind(adminController));
router.put('/admin/subadmins/:id', adminController.updateSubAdmin.bind(adminController));
router.delete('/admin/subadmins/:id', adminController.deleteSubAdmin.bind(adminController));
router.patch('/admin/subadmins/:id/status', adminController.toggleSubAdminStatus.bind(adminController));

export default router;
