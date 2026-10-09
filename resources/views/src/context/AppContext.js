import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { CATALOG_VERSION, flattenToLegacyCatalog } from '../config/serviceCatalogUtils';
import {
  BANNERS_VERSION,
  BANNERS_VERSION_KEY,
  DEFAULT_BANNERS,
  isStaleLocalImageUrl,
  resolveImageUri
} from '../utils/imageUtils';
import { getHardcodedCatalogImage } from '../utils/bundledImages';
import { normalizeSavedAddresses, upsertDefaultAddress } from '../utils/savedAddresses';
import { getPlanTheme } from '../config/planTheme';

const AppContext = createContext();

const API_BASE = 'http://127.0.0.1:3000/api';
const CATALOG_VERSION_KEY = 'zevota_catalog_version';
const BOOKINGS_VERSION = 'v9-clean-aryan'; // bump to force-reset cached bookings
const BOOKINGS_VERSION_KEY = 'zevota_bookings_version';
const WALLET_SYNC_VERSION = 'v5-fix-aryan-phone-collision';
const WALLET_SYNC_KEY = 'zevota_wallet_sync_version';

const cleanPhoneDigits = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');

const bookingBelongsToUser = (b, u) => {
  if (!b || !u) return false;
  // Match by ID first — strict to prevent same-phone users from seeing each other's bookings
  if (b.user_id != null && u.id != null && String(b.user_id) === String(u.id)) return true;
  // Only fall back to phone when booking has no user_id
  if (b.user_id != null) return false; // has ID but didn't match above — different user
  const bp = cleanPhoneDigits(b.user_phone);
  const up = cleanPhoneDigits(u.phone);
  return !!(bp && up && bp === up);
};

const paidBookingAmount = (b) =>
  Number(
    b.wallet_deducted != null
      ? b.wallet_deducted
      : b.total_bill != null
        ? b.total_bill
        : Number(b.service_charge || 0) +
          Number(b.parts_charge || 0) +
          Number(b.labour_charge || 0) -
          Number(b.discount_amount || 0)
  );

function loadBannersFromStorage() {
  try {
    const version = typeof localStorage !== 'undefined' ? localStorage.getItem(BANNERS_VERSION_KEY) : null;
    if (version !== BANNERS_VERSION) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('zevota_banners');
        localStorage.setItem(BANNERS_VERSION_KEY, BANNERS_VERSION);
      }
      return DEFAULT_BANNERS;
    }

    const saved = localStorage.getItem('zevota_banners');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((b) => {
          const fallback = DEFAULT_BANNERS.find((d) => d.id === b.id)?.image_url || DEFAULT_BANNERS[0].image_url;
          return {
            ...b,
            image_url: isStaleLocalImageUrl(b.image_url) ? fallback : (b.image_url || fallback),
          };
        });
      }
    }
  } catch (e) {}

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(BANNERS_VERSION_KEY, BANNERS_VERSION);
    } catch (_) {}
  }
  return DEFAULT_BANNERS;
}
function loadLegacyCatalogFromStorage() {
  const fresh = flattenToLegacyCatalog();

  try {
    const savedCats = localStorage.getItem('zevota_categories');
    const savedSubs = localStorage.getItem('zevota_subcategories');
    const savedSvcs = localStorage.getItem('zevota_services');

    // Images are always hardcoded — only merge name/description/time edits from admin.
    const mergedCategories = fresh.categories.map((cat) => ({ ...cat }));
    if (savedCats) {
      try {
        const parsed = JSON.parse(savedCats);
        if (Array.isArray(parsed)) {
          parsed.forEach((userCat) => {
            const idx = mergedCategories.findIndex((c) => c.name === userCat.name);
            if (idx !== -1) {
              if (userCat.description) mergedCategories[idx].description = userCat.description;
            } else if (userCat.name) {
              mergedCategories.push({
                ...userCat,
                image_url: getHardcodedCatalogImage(userCat.name),
              });
            }
          });
        }
      } catch (e) {}
    }

    const mergedSubCategories = fresh.subCategories.map((sub) => ({ ...sub }));
    if (savedSubs) {
      try {
        const parsed = JSON.parse(savedSubs);
        if (Array.isArray(parsed)) {
          parsed.forEach((userSub) => {
            const idx = mergedSubCategories.findIndex(
              (s) => s.name === userSub.name && s.category_name === userSub.category_name
            );
            if (idx !== -1) {
              if (userSub.description) mergedSubCategories[idx].description = userSub.description;
            } else if (userSub.name) {
              mergedSubCategories.push({
                ...userSub,
                image_url: getHardcodedCatalogImage(userSub.name),
              });
            }
          });
        }
      } catch (e) {}
    }

    const mergedServices = fresh.services.map((svc) => ({ ...svc }));
    if (savedSvcs) {
      try {
        const parsed = JSON.parse(savedSvcs);
        if (Array.isArray(parsed)) {
          parsed.forEach((userSvc) => {
            const idx = mergedServices.findIndex(
              (s) => s.name === userSvc.name && s.category_name === userSvc.category_name
            );
            if (idx !== -1) {
              if (userSvc.description) mergedServices[idx].description = userSvc.description;
              if (userSvc.time) mergedServices[idx].time = userSvc.time;
            } else if (userSvc.name) {
              mergedServices.push({
                ...userSvc,
                image_url: getHardcodedCatalogImage(userSvc.name),
              });
            }
          });
        }
      } catch (e) {}
    }

    localStorage.setItem(CATALOG_VERSION_KEY, CATALOG_VERSION);
    localStorage.setItem('zevota_categories', JSON.stringify(mergedCategories));
    localStorage.setItem('zevota_subcategories', JSON.stringify(mergedSubCategories));
    localStorage.setItem('zevota_services', JSON.stringify(mergedServices));

    return {
      categories: mergedCategories,
      subCategories: mergedSubCategories,
      services: mergedServices,
    };
  } catch (e) {}

  localStorage.setItem(CATALOG_VERSION_KEY, CATALOG_VERSION);
  localStorage.setItem('zevota_categories', JSON.stringify(fresh.categories));
  localStorage.setItem('zevota_subcategories', JSON.stringify(fresh.subCategories));
  localStorage.setItem('zevota_services', JSON.stringify(fresh.services));
  return fresh;
}

export function AppProvider({ children }) {
  const [activeApp, setActiveApp] = useState('USER'); // 'USER' | 'PROVIDER' | 'ADMIN'

  // User State
  const [activeUser, setActiveUser] = useState(() => {
    try {
      const saved = localStorage.getItem('zevota_active_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isAnonymous) {
          return parsed;
        }
        if (parsed && (parsed.isGuest || parsed.id === 0) && parsed.phone) {
          if (!parsed.guestId || parsed.guestId === 'GUEST') {
            let guestId = sessionStorage.getItem('zevota_guest_session_id');
            if (!guestId) {
              const counter = Number(localStorage.getItem('zevota_guest_counter') || 0) + 1;
              localStorage.setItem('zevota_guest_counter', String(counter));
              guestId = `GUEST-${String(counter).padStart(3, '0')}`;
              sessionStorage.setItem('zevota_guest_session_id', guestId);
            }
            parsed.guestId = guestId;
          }
        }
        return parsed;
      }
    } catch (e) {}
    return {
      id: 1,
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '+91 98765 43210',
      wallet_balance: 500000.0,
      subscription_plan: 'Gold',
      subscription_status: 'ACTIVE',
      property_verification_status: 'APPROVED',
      saved_addresses: [
        { id: 1, tag: 'Home', address: 'Flat 402, Sea Breeze Towers, Hill Road, Bandra West, Mumbai - 400050', isDefault: true, latitude: 19.0596, longitude: 72.8295 },
        { id: 2, tag: 'Office', address: 'Unit 12B, Zevota Corporate Park, BKC, Mumbai - 400051', isDefault: false, latitude: 19.066, longitude: 72.869 },
      ],
    };
  });

  useEffect(() => {
    try {
      if (activeUser) {
        localStorage.setItem('zevota_active_user', JSON.stringify(activeUser));
      } else {
        localStorage.removeItem('zevota_active_user');
      }
    } catch (e) {}
  }, [activeUser]);

  // Admin State — null until login (do not auto-login)
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('zevota_active_admin');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    try {
      if (adminUser) {
        localStorage.setItem('zevota_active_admin', JSON.stringify(adminUser));
      } else {
        localStorage.removeItem('zevota_active_admin');
      }
    } catch (e) {}
  }, [adminUser]);

  const logoutAdmin = () => {
    setAdminUser(null);
    try {
      localStorage.removeItem('zevota_active_admin');
    } catch (e) {}
  };

  // Provider State — null until login (do not auto-login)
  const [activeProvider, setActiveProvider] = useState(() => {
    try {
      const saved = localStorage.getItem('zevota_active_provider');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id != null) return parsed;
      }
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    try {
      if (activeProvider) {
        localStorage.setItem('zevota_active_provider', JSON.stringify(activeProvider));
      } else {
        localStorage.removeItem('zevota_active_provider');
      }
    } catch (e) {}
  }, [activeProvider]);

  const logoutProvider = () => {
    setActiveProvider(null);
    try {
      localStorage.removeItem('zevota_active_provider');
    } catch (e) {}
  };

  // Platform Data
  const [subscriptionPlans, setSubscriptionPlans] = useState(() => {
    try {
      const saved = localStorage.getItem('zevota_subscription_plans');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 1,
        name: 'Silver Home AMC',
        price: 100000.0,
        wallet_credit: 100000.0,
        validity_months: 12,
        preventive_visits_count: 2,
        parts_coverage_cap: 15000.0,
        priority_sla_hours: 4,
        applicable_services: '1-2 BHK Home, ACs, Electrical, Plumbing & Major Appliances',
        service_limits: '2 Free Preventive Visits + Unlimited Breakdown Calls',
        description: 'Essential Annual Maintenance Contract for standard apartments & modern homes.',
        features_json: JSON.stringify([
          '2 Free Preventive Maintenance Services / Year',
          '100% Free Labor on all breakdown repairs',
          '₹15,000 Annual Spare Parts Protection Allowance',
          'Standard 4-Hour Response SLA',
          'Covers 1-2 BHK Home & Registered Appliances',
        ]),
        is_recommended: false,
      },
      {
        id: 2,
        name: 'Gold Comprehensive AMC',
        price: 500000.0,
        wallet_credit: 500000.0,
        validity_months: 12,
        preventive_visits_count: 4,
        parts_coverage_cap: 40000.0,
        priority_sla_hours: 2,
        applicable_services: '3-4 BHK Homes, Multi-ACs, Refrigerators, RO, Washing Machines & Full Electrics',
        service_limits: '4 Free Preventive Visits + Unlimited 2-Hour Priority Visits',
        description: 'Most Popular UrbanClap VIP Club AMC for full home coverage & priority care.',
        features_json: JSON.stringify([
          '4 Free Preventive Maintenance Services / Year',
          'Unlimited Breakdown Visits (₹0 Labor Guaranteed)',
          '₹40,000 Annual Spare Parts Protection Cap',
          'Priority 2-Hour Dispatch SLA',
          'Dedicated Account Manager & Top-Tier Technicians',
          'Complete Home & Multi-Appliance Protection',
        ]),
        is_recommended: true,
      },
      {
        id: 3,
        name: 'Platinum Villa AMC',
        price: 1000000.0,
        wallet_credit: 1000000.0,
        validity_months: 24,
        preventive_visits_count: 6,
        parts_coverage_cap: 100000.0,
        priority_sla_hours: 1,
        applicable_services: 'Luxury Villas, High-End Smart Homes & Commercial Appliances',
        service_limits: '6 Free Preventive Visits + Unlimited 1-Hour Emergency Calls',
        description: 'Ultimate VIP protection with dedicated concierge & comprehensive coverage.',
        features_json: JSON.stringify([
          '6 Free Preventive Maintenance Services / Year',
          'Unlimited 24/7 Breakdown Visits (₹0 Labor)',
          '₹1,00,000 Comprehensive Spare Parts Allowance',
          'Express 1-Hour Emergency Arrival Guarantee',
          'VIP Key Account Manager & Free Annual Deep Audit',
          'Covers Luxury Villas, Multi-ACs & High-End Gear',
        ]),
        is_recommended: false,
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('zevota_subscription_plans', JSON.stringify(subscriptionPlans));
    } catch (e) {}
  }, [subscriptionPlans]);

  const legacyCatalog = loadLegacyCatalogFromStorage();

  const [categories, setCategories] = useState(() => legacyCatalog.categories);

  const [subCategories, setSubCategories] = useState(() => legacyCatalog.subCategories);

  const [services, setServices] = useState(() => legacyCatalog.services);

  const [bookings, setBookings] = useState(() => {
    try {
      // If bookings version doesn't match, clear and use fresh seeded defaults
      const storedVersion = localStorage.getItem(BOOKINGS_VERSION_KEY);
      if (storedVersion !== BOOKINGS_VERSION) {
        localStorage.removeItem('zevota_bookings');
        localStorage.setItem(BOOKINGS_VERSION_KEY, BOOKINGS_VERSION);
      } else {
        const saved = localStorage.getItem('zevota_bookings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {}
    return [
      {
        id: 1,
        booking_id: 'BK-2026-000125',
        user_id: 1,
        user_name: 'Rahul Sharma',
        user_phone: '+91 98765 43210',
        provider_id: 1,
        provider_name: 'Rajesh Sharma',
        provider_phone: '+91 99887 76655',
        provider_rating: 4.9,
        provider_trade: 'Electrical & AC Specialist',
        category_name: 'Electrical & AC',
        sub_category_name: 'Kitchen Appliances',
        service_name: 'Mixer & Grinder Repair',
        address_text: 'Flat 402, Sea Breeze Towers, Hill Road, Bandra West, Mumbai - 400050',
        latitude: 19.0596,
        longitude: 72.8295,
        provider_lat: 19.065,
        provider_lng: 72.835,
        last_location_update: new Date().toISOString(),
        issue_description: 'Armature coil burnt during heavy grinding.',
        issue_media_url: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&q=80&w=600',
        scheduled_date: 'Today, 2:30 PM',
        completed_date: 'Today, 3:15 PM',
        status: 'BOOKING_COMPLETED',
        inspection_report: 'Replaced armature coil, jar coupler & carbon brushes. Tested under full load.',
        service_charge: 2000.0,
        parts_charge: 4500.0,
        labour_charge: 1500.0,
        total_bill: 8000.0,
        wallet_deducted: 8000.0,
        payout_amount: 6400.0,
        bill_status: 'PAID',
        completion_otp: '4829',
      },
      {
        id: 2,
        booking_id: 'BK-2026-000142',
        user_id: 1,
        user_name: 'Rahul Sharma',
        user_phone: '+91 98765 43210',
        provider_id: 1,
        provider_name: 'Rajesh Sharma',
        provider_phone: '+91 99887 76655',
        provider_rating: 4.9,
        provider_trade: 'Electrical & AC Specialist',
        category_name: 'Electrical & AC',
        sub_category_name: 'Air Conditioner',
        service_name: 'Split AC Deep Foam Jet Cleaning',
        address_text: 'Unit 12B, Zevota Corporate Park, BKC, Mumbai - 400051',
        latitude: 19.066,
        longitude: 72.869,
        provider_lat: 19.072,
        provider_lng: 72.875,
        last_location_update: new Date().toISOString(),
        issue_description: 'AC cooling efficiency low, water dripping from indoor unit filters.',
        issue_media_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600',
        scheduled_date: 'Today, 5:00 PM',
        status: 'PROVIDER_ON_THE_WAY',
        inspection_report: '',
        service_charge: 0,
        parts_charge: 0,
        labour_charge: 0,
        total_bill: 0,
        payout_amount: 0,
        bill_status: 'UNPAID',
        completion_otp: '4829',
      },
      {
        id: 3,
        booking_id: 'BK-2026-000098',
        user_id: 2,
        user_name: 'Priya Verma',
        user_phone: '+91 98123 45678',
        provider_id: 1,
        provider_name: 'Rajesh Sharma',
        provider_phone: '+91 99887 76655',
        provider_rating: 4.9,
        provider_trade: 'Electrical & AC Specialist',
        category_name: 'Electrical & AC',
        sub_category_name: 'Home Wiring',
        service_name: 'MCB Tripping & Main Switch Repair',
        address_text: 'Bungalow 7, Juhu Scheme, Mumbai - 400049',
        latitude: 19.1075,
        longitude: 72.8263,
        provider_lat: 19.112,
        provider_lng: 72.83,
        issue_description: 'Main 32A MCB trips repeatedly when geyser and AC run simultaneously.',
        issue_media_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600',
        scheduled_date: 'Yesterday, 5:15 PM',
        completed_date: 'Yesterday, 6:30 PM',
        status: 'BOOKING_COMPLETED',
        inspection_report: 'Replaced faulty 32A Schneider MCB with 40A Heavy-Duty C-Curve MCB.',
        service_charge: 1200.0,
        parts_charge: 2800.0,
        labour_charge: 1000.0,
        total_bill: 5000.0,
        wallet_deducted: 5000.0,
        payout_amount: 4000.0,
        bill_status: 'PAID',
        completion_otp: '4829',
      },
      {
        id: 4,
        booking_id: 'BK-2026-000084',
        user_id: 5,
        user_name: 'Vikram Mehta',
        user_phone: '+91 97654 32109',
        provider_id: 1,
        provider_name: 'Rajesh Sharma',
        provider_phone: '+91 99887 76655',
        provider_rating: 4.9,
        provider_trade: 'Electrical & AC Specialist',
        category_name: 'Electrical & AC',
        sub_category_name: 'Lighting',
        service_name: 'Designer Ceiling Chandelier Installation',
        address_text: 'Apartment 1401, Imperial Towers, Tardeo, Mumbai - 400034',
        latitude: 18.967,
        longitude: 72.812,
        provider_lat: 18.972,
        provider_lng: 72.818,
        issue_description: 'Heavy 12-arm crystal chandelier installation with dimmable driver setup.',
        issue_media_url: 'https://images.unsplash.com/photo-1543198181-e619b694b30c?auto=format&fit=crop&q=80&w=600',
        scheduled_date: '28 Aug 2026, 11:00 AM',
        completed_date: '28 Aug 2026, 1:30 PM',
        status: 'BOOKING_COMPLETED',
        inspection_report: 'Anchor hook installed with heavy expansion fasteners. Dimmable driver calibrated.',
        service_charge: 2500.0,
        parts_charge: 3500.0,
        labour_charge: 2000.0,
        total_bill: 8000.0,
        wallet_deducted: 8000.0,
        payout_amount: 6400.0,
        bill_status: 'PAID',
        completion_otp: '4829',
      },
      {
        id: 5,
        booking_id: 'BK-2026-000052',
        user_id: 6,
        user_name: 'Ananya Roy',
        user_phone: '+91 98334 55667',
        provider_id: 1,
        provider_name: 'Rajesh Sharma',
        provider_phone: '+91 99887 76655',
        provider_rating: 4.9,
        provider_trade: 'Electrical & AC Specialist',
        category_name: 'Electrical & AC',
        sub_category_name: 'Air Conditioner',
        service_name: 'Gas Refill (R32 Eco Refrigerant)',
        address_text: 'Flat 703, Windsor Heights, Lokhandwala, Andheri West, Mumbai - 400053',
        latitude: 19.141,
        longitude: 72.829,
        provider_lat: 19.146,
        provider_lng: 72.834,
        issue_description: 'Low cooling due to micro copper pipe pinhole gas leak.',
        issue_media_url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&q=80&w=600',
        scheduled_date: '24 Aug 2026, 3:00 PM',
        completed_date: '24 Aug 2026, 4:45 PM',
        status: 'BOOKING_COMPLETED',
        inspection_report: 'Braze-sealed pinhole leak, nitrogen pressure tested & refilled 850g R32 refrigerant.',
        service_charge: 1800.0,
        parts_charge: 3200.0,
        labour_charge: 1000.0,
        total_bill: 6000.0,
      },
    ];
  });

  const [wallet, setWallet] = useState(() => {
    try {
      const syncOk = localStorage.getItem(WALLET_SYNC_KEY) === WALLET_SYNC_VERSION;
      const saved = localStorage.getItem('zevota_wallet');
      if (syncOk && saved) return JSON.parse(saved);
    } catch (e) {}
    // Seed ledger: Rahul Gold ₹5,00,000 − ₹8,000
    return {
      balance: 492000,
      transactions: [
        {
          transaction_id: 'TX-SEED-BK-000125',
          userId: 1,
          user_name: 'Rahul Sharma',
          user_phone: '+91 98765 43210',
          type: 'SERVICE_PAYMENT',
          category: 'Services',
          amount: 8000,
          balance_before: 500000,
          balance_after: 492000,
          description: 'Mixer & Grinder Repair — Work Order BK-2026-000125',
          booking_id: 'BK-2026-000125',
          service_name: 'Mixer & Grinder Repair',
          service_charge: 2000,
          parts_charge: 4500,
          labour_charge: 1500,
          discount_amount: 0,
          created_at: new Date().toISOString(),
        },
        {
          transaction_id: 'TX-SEED-PLAN-1',
          userId: 1,
          user_name: 'Rahul Sharma',
          user_phone: '+91 98765 43210',
          type: 'PLAN_PURCHASE',
          category: 'Plans',
          plan_name: 'Gold',
          amount: 500000,
          balance_before: 0,
          balance_after: 500000,
          description: 'Purchased Gold Plan (₹5,00,000 Wallet Credit)',
          created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        },
      ],
    };
  });

  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('zevota_users');
      if (saved) {
        let parsed = JSON.parse(saved);
        // Clean out any synthetic "Demo User" accounts
        parsed = parsed.filter(
          (u) =>
            !u.name?.toLowerCase().includes('demo user') &&
            !u.email?.toLowerCase().includes('demo.') &&
            !u.phone?.includes('11111')
        );

        if (parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return [
      {
        id: 1,
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        phone: '+91 98765 43210',
        wallet_balance: 492000.0,
        wallet_original_balance: 500000.0,
        subscription_plan: 'Gold',
        subscription_status: 'ACTIVE',
        property_verification_status: 'PENDING',
        saved_addresses: [
          { id: 1, tag: 'Home', address: 'Flat 402, Sea Breeze Towers, Hill Road, Bandra West, Mumbai - 400050', isDefault: true, latitude: 19.0596, longitude: 72.8295 },
          { id: 2, tag: 'Office', address: 'Unit 12B, Zevota Corporate Park, BKC, Mumbai - 400051', isDefault: false, latitude: 19.066, longitude: 72.869 },
        ]
      },
      {
        id: 2,
        name: 'Priya Verma',
        email: 'priya.verma@example.com',
        phone: '+91 98123 45678',
        wallet_balance: 100000.0,
        wallet_original_balance: 100000.0,
        subscription_plan: 'Silver',
        subscription_status: 'ACTIVE',
        property_verification_status: 'PENDING',
        saved_addresses: [
          { id: 3, tag: 'Home', address: 'Bungalow 7, Juhu Scheme, Mumbai - 400049', isDefault: true, latitude: 19.1075, longitude: 72.8263 }
        ]
      },
      {
        id: 5,
        name: 'Vikram Mehta',
        email: 'vikram.mehta@example.com',
        phone: '+91 97654 32109',
        wallet_balance: 200000.0,
        wallet_original_balance: 200000.0,
        subscription_plan: 'Gold',
        subscription_status: 'ACTIVE',
        property_verification_status: 'PENDING',
        saved_addresses: [
          { id: 6, tag: 'Home', address: 'Apartment 1401, Imperial Towers, Tardeo, Mumbai - 400034', isDefault: true }
        ]
      },
      {
        id: 6,
        name: 'Ananya Roy',
        email: 'ananya.roy@example.com',
        phone: '+91 98334 55667',
        wallet_balance: 150000.0,
        wallet_original_balance: 150000.0,
        subscription_plan: 'Silver',
        subscription_status: 'ACTIVE',
        property_verification_status: 'PENDING',
        saved_addresses: [
          { id: 7, tag: 'Home', address: 'Flat 703, Windsor Heights, Lokhandwala, Andheri West, Mumbai - 400053', isDefault: true }
        ]
      },
      {
        id: 7,
        name: 'Aryan',
        email: 'aryan123@gmail.com',
        phone: '+91 98765 00001',
        wallet_balance: 0,
        wallet_original_balance: 0,
        subscription_plan: null,
        subscription_status: 'INACTIVE',
        property_verification_status: 'PENDING',
        saved_addresses: [
          { id: 8, tag: 'Home', address: 'Flat 201, Krishna Residency, Vaishali Nagar, Jaipur - 302021', isDefault: true, latitude: 26.9124, longitude: 75.7873 }
        ]
      }
    ];
  });

  useEffect(() => {
    try {
      if (activeUser) {
        localStorage.setItem('zevota_active_user', JSON.stringify(activeUser));
      } else {
        localStorage.removeItem('zevota_active_user');
      }
    } catch (e) {}
  }, [activeUser]);

  // Repair duplicate / multi-default saved addresses from older property saves
  useEffect(() => {
    if (!activeUser?.id || !Array.isArray(activeUser.saved_addresses)) return;
    const raw = activeUser.saved_addresses;
    const defaults = raw.filter((a) => a.isDefault).length;
    const needsRepair = defaults > 1 || raw.length !== normalizeSavedAddresses(raw).length;
    if (!needsRepair) return;
    const normalized = normalizeSavedAddresses(raw);
    const repaired = { ...activeUser, saved_addresses: normalized };
    setActiveUser(repaired);
    setUsers((prev) =>
      prev.map((u) => (u.id === repaired.id ? { ...u, saved_addresses: normalized } : u))
    );
  }, [activeUser?.id, activeUser?.saved_addresses]);

  // Repair inflated wallet balances / missing passbook entries from old payment bug
  useEffect(() => {
    if (!activeUser?.subscription_plan || activeUser.subscription_status !== 'ACTIVE') return;

    const plan = subscriptionPlans.find((p) => p.name === activeUser.subscription_plan);
    if (!plan) return;

    const expectedCredit = Number(plan.wallet_credit || 0);
    const phoneKey = cleanPhoneDigits(activeUser.phone);
    const userTxs = (wallet.transactions || []).filter((tx) => {
      if (tx.userId != null && tx.userId === activeUser.id) return true;
      return phoneKey && cleanPhoneDigits(tx.user_phone) === phoneKey;
    });
    const serviceDebits = userTxs
      .filter((tx) => tx.type === 'SERVICE_PAYMENT')
      .reduce((s, tx) => s + Math.abs(Number(tx.amount || 0)), 0);
    const expectedRemaining = Math.max(0, expectedCredit - serviceDebits);
    const current = Number(activeUser.wallet_balance || 0);
    const hasPlanPurchase = userTxs.some((tx) => tx.type === 'PLAN_PURCHASE');

    const needsBalanceRepair = current > expectedRemaining + 0.5;
    const needsTxRepair = !hasPlanPurchase && expectedCredit > 0;
    const needsOriginal = activeUser.wallet_original_balance == null && expectedCredit > 0;
    if (!needsBalanceRepair && !needsTxRepair && !needsOriginal) return;

    const fixedBalance = needsBalanceRepair ? expectedRemaining : current;

    if (needsBalanceRepair || needsOriginal) {
      const repairedUser = {
        ...activeUser,
        wallet_balance: fixedBalance,
        wallet_original_balance: activeUser.wallet_original_balance ?? expectedCredit,
      };
      setActiveUser(repairedUser);
      localStorage.setItem('zevota_active_user', JSON.stringify(repairedUser));
      setUsers((prev) =>
        prev.map((u) =>
          u.id === activeUser.id
            ? {
                ...u,
                wallet_balance: fixedBalance,
                wallet_original_balance: u.wallet_original_balance ?? expectedCredit,
              }
            : u
        )
      );
    }

    setWallet((prev) => {
      const txs = [...(prev?.transactions || [])];
      if (needsTxRepair) {
        txs.unshift({
          transaction_id: `TX-SYNC-${activeUser.id}-${plan.id}`,
          userId: activeUser.id,
          user_name: activeUser.name || 'Demo User',
          user_phone: activeUser.phone,
          type: 'PLAN_PURCHASE',
          category: 'Plans',
          plan_name: plan.name,
          amount: expectedCredit,
          balance_before: 0,
          balance_after: expectedCredit,
          description: `Purchased ${plan.name} Plan (₹${expectedCredit.toLocaleString('en-IN')} Wallet Credit)`,
          created_at: new Date().toISOString(),
        });
      }
      return { balance: fixedBalance, transactions: txs };
    });
  }, [activeUser?.id, activeUser?.subscription_plan, activeUser?.subscription_status, subscriptionPlans, wallet.transactions]);

  const activeAmc = React.useMemo(() => {
    if (!activeUser || activeUser.isGuest) return null;
    const planName = activeUser.subscription_plan || '';
    const hasPlan = planName && planName !== 'None' && planName !== 'None / Inactive';
    if (!hasPlan) return null;

    const theme = getPlanTheme(planName);
    const contractNo =
      activeUser.amc_contract_number ||
      `AMC-2026-${String(activeUser.id || 1).padStart(4, '0')}${String(activeUser.phone || '9999').replace(/\D/g, '').slice(-4)}`;
    const visitsRemaining =
      activeUser.amc_preventive_remaining != null
        ? activeUser.amc_preventive_remaining
        : (theme.preventiveVisits || 2);
    const totalVisits = theme.preventiveVisits || 2;
    const partsCap = theme.partsCap || 15000;
    const partsRemaining =
      activeUser.amc_parts_allowance_remaining != null
        ? activeUser.amc_parts_allowance_remaining
        : partsCap;

    const resolvedExpiry =
      activeUser.amc_expiry_date ||
      activeUser.subscription_expires_at ||
      '2027-09-07T00:00:00.000Z';

    const computeStartFromExpiry = (expStr) => {
      try {
        const d = new Date(expStr);
        if (!Number.isNaN(d.getTime())) {
          const s = new Date(d);
          s.setFullYear(s.getFullYear() - 1);
          return s.toISOString();
        }
      } catch (e) {}
      return '2026-09-07T00:00:00.000Z';
    };

    const rawStart =
      activeUser.amc_start_date ||
      activeUser.subscription_started_at;

    const resolvedStart =
      rawStart && !String(rawStart).includes('2026-01-01')
        ? rawStart
        : computeStartFromExpiry(resolvedExpiry);

    return {
      status: 'ACTIVE',
      planName: planName,
      contractNo: contractNo,
      startDate: resolvedStart,
      expiryDate: resolvedExpiry,
      daysRemaining: 336,
      visitsRemaining: visitsRemaining,
      totalVisits: totalVisits,
      partsRemaining: partsRemaining,
      partsCap: partsCap,
      slaHours: theme.slaHours || 4,
      tierBadge: theme.tierBadge || 'VIP AMC',
      goldAccent: theme.goldAccent || '#d4af37',
      annualSavings: 14850,
    };
  }, [activeUser]);

  // Backfill SERVICE_PAYMENT ledger + wallet balance for PAID bookings that never deducted (one-time)
  useEffect(() => {
    try {
      if (localStorage.getItem(WALLET_SYNC_KEY) === WALLET_SYNC_VERSION) return;
    } catch (e) {}

    const paid = (bookings || []).filter(
      (b) => b.bill_status === 'PAID' && !b.isConsultation && paidBookingAmount(b) > 0
    );
    const txs = [...(wallet.transactions || [])];
    const missing = paid.filter(
      (b) => !txs.some((tx) => tx.type === 'SERVICE_PAYMENT' && tx.booking_id === b.booking_id)
    );

    const newTxs = missing.map((b) => {
      const amount = paidBookingAmount(b);
      const owner = (users || []).find((u) => bookingBelongsToUser(b, u));
      const plan = (subscriptionPlans || []).find((p) => p.name === owner?.subscription_plan);
      const original =
        owner?.wallet_original_balance != null
          ? Number(owner.wallet_original_balance)
          : Number(plan?.wallet_credit || owner?.wallet_balance || 0);
      return {
        transaction_id: `TX-SYNC-${b.booking_id}`,
        userId: owner?.id ?? b.user_id,
        user_name: owner?.name || b.user_name,
        user_phone: owner?.phone || b.user_phone,
        type: 'SERVICE_PAYMENT',
        category: 'Services',
        amount,
        balance_before: original,
        balance_after: Math.max(0, original - amount),
        description: `${b.service_name || 'Service'} — Work Order ${b.booking_id}`,
        booking_id: b.booking_id,
        service_name: b.service_name || 'Service',
        service_charge: Number(b.service_charge || 0),
        parts_charge: Number(b.parts_charge || 0),
        labour_charge: Number(b.labour_charge || 0),
        discount_amount: Number(b.discount_amount || 0),
        created_at: new Date().toISOString(),
      };
    });

    const mergedTxs = [...newTxs, ...txs];

    if (paid.length > 0) {
      setUsers((prev) =>
        prev.map((u) => {
          const userPaid = paid.filter((b) => bookingBelongsToUser(b, u));
          if (userPaid.length === 0) return u;
          const plan = (subscriptionPlans || []).find((p) => p.name === u.subscription_plan);
          const original =
            u.wallet_original_balance != null
              ? Number(u.wallet_original_balance)
              : Number(plan?.wallet_credit || u.wallet_balance || 0);
          const userDebits = mergedTxs
            .filter(
              (tx) =>
                tx.type === 'SERVICE_PAYMENT' &&
                ((tx.userId != null && tx.userId === u.id) ||
                  cleanPhoneDigits(tx.user_phone) === cleanPhoneDigits(u.phone))
            )
            .reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);
          return {
            ...u,
            wallet_original_balance: original,
            wallet_balance: Math.max(0, original - userDebits),
          };
        })
      );

      setActiveUser((prev) => {
        if (!prev) return prev;
        const userPaid = paid.filter((b) => bookingBelongsToUser(b, prev));
        if (userPaid.length === 0) return prev;
        const plan = (subscriptionPlans || []).find((p) => p.name === prev.subscription_plan);
        const original =
          prev.wallet_original_balance != null
            ? Number(prev.wallet_original_balance)
            : Number(plan?.wallet_credit || prev.wallet_balance || 0);
        const userDebits = mergedTxs
          .filter(
            (tx) =>
              tx.type === 'SERVICE_PAYMENT' &&
              ((tx.userId != null && tx.userId === prev.id) ||
                cleanPhoneDigits(tx.user_phone) === cleanPhoneDigits(prev.phone))
          )
          .reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);
        return {
          ...prev,
          wallet_original_balance: original,
          wallet_balance: Math.max(0, original - userDebits),
        };
      });

      setBookings((prev) =>
        prev.map((b) =>
          b.bill_status === 'PAID' && b.wallet_deducted == null
            ? { ...b, wallet_deducted: paidBookingAmount(b) }
            : b
        )
      );

      if (newTxs.length > 0) {
        setWallet({ balance: mergedTxs[0]?.balance_after ?? 0, transactions: mergedTxs });
      }
    }

    try {
      localStorage.setItem(WALLET_SYNC_KEY, WALLET_SYNC_VERSION);
    } catch (e) {}
  }, [bookings, users, wallet.transactions, subscriptionPlans]);

  useEffect(() => {
    try {
      localStorage.setItem('zevota_users', JSON.stringify(users));
    } catch (e) {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('zevota_bookings', JSON.stringify(bookings));
    } catch (e) {}
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem('zevota_wallet', JSON.stringify(wallet));
    } catch (e) {}
  }, [wallet]);

  // Synchronize activeUser changes directly into the users array dynamically
  useEffect(() => {
    if (activeUser && users.length > 0) {
      setUsers((prevUsers) => {
        const existing = prevUsers.find(u => u.id === activeUser.id);
        if (existing && JSON.stringify(existing) !== JSON.stringify(activeUser)) {
          return prevUsers.map((u) => (u.id === activeUser.id ? { ...u, ...activeUser } : u));
        }
        return prevUsers;
      });
    }
  }, [activeUser]);

  useEffect(() => {
    try {
      localStorage.setItem('zevota_categories', JSON.stringify(categories));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        try {
          const stripped = categories.map((c) => ({ ...c, image_url: c.image_url?.startsWith('data:') ? '' : c.image_url }));
          localStorage.setItem('zevota_categories', JSON.stringify(stripped));
        } catch (err) {}
      }
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('zevota_subcategories', JSON.stringify(subCategories));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        try {
          const stripped = subCategories.map((s) => ({ ...s, image_url: s.image_url?.startsWith('data:') ? '' : s.image_url }));
          localStorage.setItem('zevota_subcategories', JSON.stringify(stripped));
        } catch (err) {}
      }
    }
  }, [subCategories]);

  useEffect(() => {
    try {
      localStorage.setItem('zevota_services', JSON.stringify(services));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        try {
          const stripped = services.map((s) => ({ ...s, image_url: s.image_url?.startsWith('data:') ? '' : s.image_url }));
          localStorage.setItem('zevota_services', JSON.stringify(stripped));
        } catch (err) {}
      }
    }
  }, [services]);


  const [providers, setProviders] = useState(() => {
    try {
      const saved = localStorage.getItem('zevota_providers');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 1,
        name: 'Rajesh Sharma',
        phone: '+91 99887 76655',
        rating: 4.9,
        total_jobs: 142,
        earnings: 128500.0,
        trade: 'Electrical & AC Specialist',
        location: 'Bandra West (1.2 km away)',
      },
      {
        id: 2,
        name: 'Suresh Kumar',
        phone: '+91 98989 12345',
        rating: 4.7,
        total_jobs: 98,
        earnings: 84000.0,
        trade: 'Plumbing Specialist',
        location: 'Andheri East (4.5 km away)',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('zevota_providers', JSON.stringify(providers));
    } catch (e) {}
  }, [providers]);

  const [banners, setBanners] = useState(() => loadBannersFromStorage());

  useEffect(() => {
    try {
      localStorage.setItem('zevota_banners', JSON.stringify(banners));
    } catch (e) {
      // Storage quota exceeded (likely large data URL image)
      // Retry saving with data URLs stripped to avoid losing all banners
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        try {
          const stripped = banners.map((b) => ({
            ...b,
            image_url: b.image_url?.startsWith('data:') ? '' : b.image_url,
          }));
          localStorage.setItem('zevota_banners', JSON.stringify(stripped));
        } catch (_) {}
      }
    }
  }, [banners]);

  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem('zevota_chats');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 1, user_id: 1, sender: 'User (Rahul)', senderType: 'user', text: 'Is provider Rajesh Sharma on the way?', time: '10:00 AM' },
      { id: 2, user_id: 1, sender: 'Admin', senderType: 'admin', text: 'Yes, Rajesh has accepted BK-2026-000125 and will arrive at 4:00 PM.', time: '10:02 AM' },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('zevota_chats', JSON.stringify(chats));
    } catch (e) {}
  }, [chats]);

  // Service Areas State (Requirement 18)
  const [serviceAreas, setServiceAreas] = useState(() => {
    try {
      const saved = localStorage.getItem('zevota_service_areas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 1,
        name: 'Mumbai Metro Coverage Zone',
        region: 'Mumbai, Maharashtra',
        center_locality: 'Bandra West & BKC',
        radius_km: 25,
        status: 'ACTIVE',
        pincodes: ['400050', '400051', '400049', '400034', '400053', '400018', '400076', '400001'],
        keywords: ['mumbai', 'bandra', 'bkc', 'juhu', 'andheri', 'tardeo', 'lokhandwala', 'powai', 'worli', 'dadar', 'lower parel', 'malad', 'borivali'],
        lat: 19.0596,
        lng: 72.8295,
      },
      {
        id: 2,
        name: 'Jaipur Central Zone',
        region: 'Jaipur, Rajasthan',
        center_locality: 'C-Scheme & Vaishali Nagar',
        radius_km: 15,
        status: 'ACTIVE',
        pincodes: ['302001', '302021', '302017', '302004', '302015'],
        keywords: ['jaipur', 'c-scheme', 'c scheme', 'malviya nagar', 'vaishali nagar', 'raja park', 'residency towers', 'mansarovar'],
        lat: 26.9124,
        lng: 75.7873,
      },
      {
        id: 3,
        name: 'Gurugram / NCR Tech Hub Zone',
        region: 'Gurugram, Haryana',
        center_locality: 'Cyber City & Golf Course Road',
        radius_km: 20,
        status: 'ACTIVE',
        pincodes: ['122001', '122002', '122003', '122018'],
        keywords: ['gurugram', 'gurgaon', 'cyber city', 'dlf', 'golf course', 'pearl heights', 'sohna road', 'sector 54'],
        lat: 28.4595,
        lng: 77.0266,
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('zevota_service_areas', JSON.stringify(serviceAreas));
    } catch (e) {}
  }, [serviceAreas]);

  const validateServiceLocation = (addressText) => {
    if (!addressText || typeof addressText !== 'string' || !addressText.trim()) {
      return { isSupported: false, message: 'Please enter a valid service location address.' };
    }
    const cleanAddr = addressText.toLowerCase().trim();
    const activeZones = (serviceAreas || []).filter((zone) => zone.status === 'ACTIVE');

    if (activeZones.length === 0) {
      return { isSupported: false, message: 'All service coverage zones are currently inactive.' };
    }

    const pinMatch = cleanAddr.match(/\b\d{6}\b/);
    const userPincode = pinMatch ? pinMatch[0] : null;

    for (const zone of activeZones) {
      if (userPincode && (zone.pincodes || []).some((pin) => pin === userPincode)) {
        return { isSupported: true, matchedArea: zone, message: `Location verified inside ${zone.name}!` };
      }
      if ((zone.keywords || []).some((kw) => kw && cleanAddr.includes(kw.toLowerCase()))) {
        return { isSupported: true, matchedArea: zone, message: `Location verified inside ${zone.name}!` };
      }
    }

    const activeNames = activeZones.map((z) => z.region || z.name).join(', ');
    return {
      isSupported: false,
      matchedArea: null,
      message: `Zevota Care service is currently unavailable at this location. We currently operate in: ${activeNames}.`,
    };
  };

  const addServiceArea = (areaData) => {
    const newZone = {
      id: Date.now(),
      status: 'ACTIVE',
      radius_km: Number(areaData.radius_km || 15),
      pincodes: (areaData.pincodesText || '').split(',').map((p) => p.trim()).filter((p) => p),
      keywords: (areaData.keywordsText || '').split(',').map((k) => k.trim().toLowerCase()).filter((k) => k),
      ...areaData,
    };
    setServiceAreas((prev) => [newZone, ...prev]);
    return newZone;
  };

  const updateServiceArea = (id, updatedData) => {
    setServiceAreas((prev) =>
      prev.map((z) => (z.id === id ? { ...z, ...updatedData } : z))
    );
  };

  const toggleServiceAreaStatus = (id) => {
    setServiceAreas((prev) =>
      prev.map((z) => (z.id === id ? { ...z, status: z.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : z))
    );
  };

  const deleteServiceArea = (id) => {
    setServiceAreas((prev) => prev.filter((z) => z.id !== id));
  };

  // Auth Actions
  const getCleanPhone = (p) => {
    if (!p) return '';
    const digits = p.replace(/\D/g, '');
    if (digits.length > 5 && digits.startsWith('91')) {
      return digits.slice(2);
    }
    return digits;
  };

  const bookingBelongsToUser = (booking, user) => {
    if (!booking || !user) return false;
    if (booking.user_id != null && user.id != null) {
      return String(booking.user_id) === String(user.id);
    }
    if (booking.user_id != null) return false;
    if (booking.user_phone && user.phone && getCleanPhone(booking.user_phone) === getCleanPhone(user.phone)) return true;
    return false;
  };

  const getUserBookings = (user = activeUser) => {
    if (!user) return [];
    return bookings.filter((booking) => bookingBelongsToUser(booking, user));
  };

  const findUserByPhone = (phone) => {
    const target = getCleanPhone(phone);
    return users.find((u) => getCleanPhone(u.phone) === target);
  };

  const registerUser = (profileData) => {
    const cleanNum = getCleanPhone(profileData.phone);
    const newUser = {
      id: users.length + 1,
      name: profileData.name,
      email: profileData.email,
      phone: `+91 ${cleanNum}`,
      dob: profileData.dob || '',
      gender: profileData.gender || '',
      address: profileData.address || '',
      property: null,
      saved_addresses: [],
      wallet_balance: 0,
      subscription_plan: null,
      subscription_status: 'INACTIVE',
      property_verification_status: 'PENDING',
      registered_at: new Date().toLocaleString(),
    };
    setUsers((prev) => [newUser, ...prev]);
    setActiveUser(newUser);
    return newUser;
  };

  const _makeGuestUser = (phone = '') => {
    let guestId;
    try {
      const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';
      let guestPhoneMap = {};
      try {
        guestPhoneMap = JSON.parse(localStorage.getItem('zevota_guest_phone_map') || '{}');
      } catch (e) {}

      if (cleanPhone && guestPhoneMap[cleanPhone]) {
        guestId = guestPhoneMap[cleanPhone];
      } else {
        const counter = Number(localStorage.getItem('zevota_guest_counter') || 0) + 1;
        localStorage.setItem('zevota_guest_counter', String(counter));
        guestId = `GUEST-${String(counter).padStart(3, '0')}`;
        if (cleanPhone) {
          guestPhoneMap[cleanPhone] = guestId;
          localStorage.setItem('zevota_guest_phone_map', JSON.stringify(guestPhoneMap));
        }
      }
      sessionStorage.setItem('zevota_guest_session_id', guestId);
    } catch (e) {
      guestId = 'GUEST-001';
    }
    return {
      id: 0,
      isGuest: true,
      guestId,
      name: 'Guest User',
      email: '',
      phone: phone ? `+91 ${String(phone).replace(/\D/g, '').slice(-10)}` : '',
      wallet_balance: 0.0,
      wallet_original_balance: 0.0,
      subscription_plan: null,
      subscription_status: 'INACTIVE',
      property_verification_status: 'PENDING',
      address: '',
      saved_addresses: [],
    };
  };

  const loginGuestUser = (phone = '') => {
    const guestUser = _makeGuestUser(phone);
    setActiveUser(guestUser);
    try {
      localStorage.setItem('zevota_active_user', JSON.stringify(guestUser));
    } catch (e) {}
    return guestUser;
  };

  const loginUser = (phone) => {
    const existing = findUserByPhone(phone);
    if (existing) {
      setActiveUser(existing);
      return { success: true, user: existing };
    }
    return { success: false };
  };

  const logoutUser = () => {
    setActiveUser(null);
    try {
      localStorage.removeItem('zevota_active_user');
      sessionStorage.removeItem('zevota_guest_session_id');
    } catch (e) {}
  };

  const skipAuth = () => {
    const anonUser = {
      id: 0,
      isGuest: true,
      isAnonymous: true,
      guestId: null,
      name: '',
      email: '',
      phone: '',
      wallet_balance: 0.0,
      wallet_original_balance: 0.0,
      subscription_plan: null,
      subscription_status: 'INACTIVE',
      property_verification_status: 'PENDING',
      address: '',
      saved_addresses: [],
    };
    setActiveUser(anonUser);
    try {
      localStorage.setItem('zevota_active_user', JSON.stringify(anonUser));
      sessionStorage.removeItem('zevota_guest_session_id');
    } catch (e) {}
    return anonUser;
  };

  const updateProfile = (profileData) => {
    if (!profileData) return;
    if (activeUser?.isGuest || activeUser?.id === 0 || activeUser?.name === 'Guest User' || activeUser?.phone === '+91 00000 00000') {
      return; // Guest profile cannot save or change addresses
    }
    // Never invent a session from a partial object when logged out
    if (!activeUser || (activeUser.id == null && !activeUser.phone)) {
      if (profileData.id == null && !profileData.phone) return;
    }
    const next = { ...(activeUser || {}), ...profileData };
    if (profileData.address && !profileData.saved_addresses) {
      next.saved_addresses = upsertDefaultAddress(
        next.saved_addresses || [],
        profileData.address,
        {
          latitude: profileData.latitude ?? next.latitude,
          longitude: profileData.longitude ?? next.longitude,
        }
      );
    } else if (Array.isArray(next.saved_addresses)) {
      next.saved_addresses = normalizeSavedAddresses(next.saved_addresses);
    }
    setActiveUser(next);
    if (next.id != null) {
      setUsers((prev) =>
        prev.map((u) => (u.id === next.id ? { ...u, ...next } : u))
      );
    }
  };

  // Global Actions
  const createBooking = async (bookingData) => {
    // No amount is attached at booking time. The bill is created later by the admin
    // (after the provider inspects) via generateBill().
    const isConsultation = !!(
      bookingData.isConsultation ||
      bookingData.bookingMode === 'consultation'
    );

    const scheduleLabel =
      bookingData.schedule ||
      [bookingData.scheduledDateLabel || bookingData.scheduledDate, bookingData.scheduledTime]
        .filter(Boolean)
        .join(', ') ||
      'Today, 4:00 PM';

    const newId = `BK-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const defaultAddr =
      (activeUser?.saved_addresses || []).find((a) => a.isDefault) ||
      (activeUser?.saved_addresses || [])[0] ||
      null;
    const resolvedLat =
      bookingData.latitude ??
      activeUser?.latitude ??
      defaultAddr?.latitude ??
      null;
    const resolvedLng =
      bookingData.longitude ??
      activeUser?.longitude ??
      defaultAddr?.longitude ??
      null;
    const newBk = {
      id: bookings.length + 1,
      booking_id: newId,
      user_id: activeUser.id,
      user_name: activeUser.name,
      user_phone: activeUser.phone,
      category_name: bookingData.category || 'Electrician',
      sub_category_name: bookingData.subCategory || 'General',
      service_name: bookingData.service || 'Service Request',
      address_text: bookingData.address || activeUser.address || 'Bandra West, Mumbai',
      latitude: resolvedLat,
      longitude: resolvedLng,
      issue_description:
        bookingData.issueDescription ||
        bookingData.issue ||
        bookingData.description ||
        (isConsultation ? 'Consultation requested' : 'Service required'),
      issue: bookingData.issue || bookingData.description || '',
      issueId: bookingData.issueId || null,
      issueDescription: bookingData.issueDescription || '',
      issueMedia: bookingData.issueMedia || { photos: [], videos: [] },
      issue_media_url:
        bookingData.mediaUrl ||
        bookingData.issue_media_url ||
        bookingData.issueMedia?.photos?.[0]?.uri ||
        bookingData.issueMedia?.videos?.[0]?.uri ||
        '',
      scheduled_date: bookingData.scheduledDate || scheduleLabel,
      scheduled_time: bookingData.scheduledTime || '',
      scheduledDate: bookingData.scheduledDate || null,
      scheduledTime: bookingData.scheduledTime || null,
      schedule: scheduleLabel,
      status: 'PENDING_ADMIN_REVIEW',
      applianceId: bookingData.applianceId ?? null,
      applianceTypeId: bookingData.applianceTypeId ?? null,
      applianceName: bookingData.applianceName || '',
      applianceDetails: bookingData.applianceDetails || null,
      isNewAppliance: !!bookingData.isNewAppliance,
      applianceCount: bookingData.applianceCount ?? 1,
      appliance_registration_fee: Number(bookingData.applianceRegistrationFee ?? (bookingData.isCoveredByAmc || isConsultation ? 0 : (bookingData.applianceId ? 500 : 0))),
      is_covered_by_amc: !!bookingData.isCoveredByAmc,
      booking_mode: isConsultation ? 'consultation' : bookingData.bookingMode || 'service',
      isConsultation,
      service_charge: 0,
      parts_charge: 0,
      labour_charge: 0,
      discount_amount: 0,
      total_bill: null,
      bill_status: null,
      bill_sent: false,
      bill_generated: false,
      completion_otp: '4829',
    };

    setBookings([newBk, ...bookings]);
    return newBk;
  };

  const assignProvider = (bookingId, providerId) => {
    const prov = providers.find((p) => p.id === providerId);
    if (!prov) return;
    setBookings((prev) =>
      prev.map((b) => {
        if (b.booking_id !== bookingId) return b;
        const bLat = Number(b.latitude) || 19.0596;
        const bLng = Number(b.longitude) || 72.8295;
        return {
          ...b,
          provider_id: prov.id,
          provider_name: prov.name,
          provider_phone: prov.phone || '',
          provider_rating: prov.rating ?? null,
          provider_trade: prov.trade || prov.specialty || 'Certified Technician',
          provider_photo: prov.photo || prov.avatar || null,
          provider_lat: b.provider_lat || bLat + 0.0075,
          provider_lng: b.provider_lng || bLng + 0.0065,
          last_location_update: new Date().toISOString(),
          status: 'PROVIDER_ASSIGNED',
        };
      })
    );
  };

  const acceptBooking = (bookingId) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.booking_id === bookingId
          ? { ...b, is_accepted: true, status: 'ADMIN_ACCEPTED' }
          : b
      )
    );
  };

  const rejectBooking = (bookingId) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.booking_id === bookingId
          ? { ...b, is_accepted: false, status: 'ADMIN_REJECTED' }
          : b
      )
    );
  };

  const submitInspectionReport = (bookingId, reportData) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.booking_id === bookingId
          ? {
              ...b,
              inspection_report: reportData.findings,
              issue_media_url: reportData.mediaUrl || b.issue_media_url,
              parts_charge: Number(reportData.partsCost || 0),
              labour_charge: Number(reportData.labourCost || 0),
              service_charge: Number(reportData.serviceCost || 0),
              status: 'ASSIGNED_TO_ADMIN',
            }
          : b
      )
    );
  };

  const updateBookingStatus = (bookingId, newStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.booking_id === bookingId ? { ...b, status: newStatus } : b))
    );
  };

  const submitBookingRating = (bookingId, ratingOrPayload, feedback = '', tags = []) => {
    const payload =
      ratingOrPayload && typeof ratingOrPayload === 'object' && !Array.isArray(ratingOrPayload)
        ? ratingOrPayload
        : { rating: ratingOrPayload, feedback, tags };

    const rating = Number(payload.rating) || 0;
    const feedbackText = payload.feedback || '';
    const feedbackTags = Array.isArray(payload.tags) ? payload.tags : [];
    const issueResolved = payload.issueResolved || null;
    const ratingPhotos = Array.isArray(payload.ratingPhotos)
      ? payload.ratingPhotos.filter((u) => typeof u === 'string' && u).slice(0, 3)
      : [];

    let targetProviderName = null;
    setBookings((prev) =>
      prev.map((b) => {
        if (b.booking_id === bookingId) {
          targetProviderName = b.provider_name;
          return {
            ...b,
            user_rating: rating,
            user_feedback: feedbackText,
            feedback_tags: feedbackTags,
            issue_resolved: issueResolved,
            rating_photos: ratingPhotos,
            rating_skipped: false,
            rating_submitted_at: new Date().toISOString(),
          };
        }
        return b;
      })
    );

    if (targetProviderName && rating > 0) {
      setProviders((prev) =>
        prev.map((p) => {
          if (p.name === targetProviderName) {
            const currentTotal = p.total_jobs || 1;
            const currentRating = p.rating || 4.8;
            const newRating = Number(((currentRating * currentTotal + rating) / (currentTotal + 1)).toFixed(1));
            return {
              ...p,
              rating: newRating,
              total_jobs: currentTotal + 1,
            };
          }
          return p;
        })
      );
    }
  };

  const skipBookingRating = (bookingId) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.booking_id === bookingId
          ? {
              ...b,
              rating_skipped: true,
              rating_skipped_at: new Date().toISOString(),
            }
          : b
      )
    );
  };

  const updateProviderLocation = (bookingId, lat, lng) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.booking_id === bookingId
          ? {
              ...b,
              provider_lat: lat,
              provider_lng: lng,
              last_location_update: new Date().toISOString(),
            }
          : b
      )
    );
  };

  const uploadBookingMedia = (bookingId, type, url) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.booking_id === bookingId
          ? {
              ...b,
              [type === 'before' ? 'before_media_url' : 'after_media_url']: url,
            }
          : b
      )
    );
  };

  const generateBill = (bookingId, billData) => {
    const service_charge = Number(billData.service_charge || 0);
    const parts_charge = Number(billData.parts_charge || 0);
    const labour_charge = Number(billData.labour_charge || 0);
    const discount_amount = Number(billData.discount || 0);
    const total = service_charge + parts_charge + labour_charge - discount_amount;
    const payout_amount = Math.round(total * 0.8);

    setBookings((prev) =>
      prev.map((b) =>
        b.booking_id === bookingId
          ? {
              ...b,
              service_charge,
              parts_charge,
              labour_charge,
              discount_amount,
              total_bill: total,
              payout_amount,
              bill_status: b.bill_status === 'PAID' ? 'PAID' : 'UNPAID',
              bill_sent: true,
              bill_generated: true,
              status: 'AWAITING_USER_APPROVAL',
              inspection_report: billData.notes || billData.findings || b.inspection_report,
              parts_description: billData.parts_description || b.parts_description,
            }
          : b
      )
    );
  };

  const approveBill = (bookingId, options = {}) => {
    const bk = bookings.find((b) => b.booking_id === bookingId);
    if (!bk || !activeUser) return { ok: false, error: 'Booking or user not found.' };

    const otp = bk.completion_otp || String(Math.floor(1000 + Math.random() * 9000));

    if (bk.bill_status === 'PAID' || bk.bill_status === 'PAY_ON_COMPLETION') {
      setBookings((prev) =>
        prev.map((b) =>
          b.booking_id === bookingId
            ? { ...b, status: 'SERVICE_IN_PROGRESS', completion_otp: otp }
            : b
        )
      );
      return { ok: true, alreadyPaid: true, otp };
    }

    if (options.paymentMethod === 'PAY_ON_COMPLETION' || options.payLater) {
      setBookings((prev) =>
        prev.map((b) =>
          b.booking_id === bookingId
            ? {
                ...b,
                bill_status: 'PAY_ON_COMPLETION',
                payment_mode: 'PAY_AFTER_SERVICE',
                status: 'SERVICE_IN_PROGRESS',
                completion_otp: otp,
                quote_approved_at: new Date().toISOString(),
              }
            : b
        )
      );
      return { ok: true, paymentMethod: 'PAY_ON_COMPLETION', otp };
    }

    const serviceCharge = Number(bk.service_charge || 0);
    const partsCharge = Number(bk.parts_charge || 0);
    const labourCharge = Number(bk.labour_charge || 0);
    const discountAmount = Number(bk.discount_amount || 0);
    const amount = Number(
      bk.total_bill != null
        ? bk.total_bill
        : serviceCharge + partsCharge + labourCharge - discountAmount
    );
    const balanceBefore = Number(activeUser.wallet_balance || 0);
    if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Invalid bill amount.' };
    if (balanceBefore < amount) {
      return {
        ok: false,
        error: `Insufficient wallet balance. Need ₹${amount.toLocaleString('en-IN')}, available ₹${balanceBefore.toLocaleString('en-IN')}.`,
      };
    }
    const newBal = balanceBefore - amount;
    const nowIso = new Date().toISOString();

    const updatedUser = { ...activeUser, wallet_balance: newBal };
    setActiveUser(updatedUser);
    try {
      localStorage.setItem('zevota_active_user', JSON.stringify(updatedUser));
    } catch (e) {}

    setUsers((prev) => {
      const next = prev.map((u) =>
        u.id === activeUser.id ? { ...u, wallet_balance: newBal } : u
      );
      try {
        localStorage.setItem('zevota_users', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    const newTx = {
      transaction_id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: activeUser.id,
      user_phone: activeUser.phone,
      type: 'SERVICE_PAYMENT',
      category: 'Services',
      amount,
      balance_before: balanceBefore,
      balance_after: newBal,
      description: `${bk.service_name || 'Service'} — Work Order ${bookingId}`,
      booking_id: bookingId,
      service_name: bk.service_name || 'Service',
      service_charge: serviceCharge,
      parts_charge: partsCharge,
      labour_charge: labourCharge,
      discount_amount: discountAmount,
      created_at: nowIso,
    };

    setWallet((prev) => {
      const updatedWallet = {
        balance: newBal,
        transactions: [newTx, ...(prev?.transactions || [])],
      };
      try {
        localStorage.setItem('zevota_wallet', JSON.stringify(updatedWallet));
      } catch (e) {}
      return updatedWallet;
    });

    setBookings((prev) =>
      prev.map((b) =>
        b.booking_id === bookingId
          ? {
              ...b,
              bill_status: 'PAID',
              payment_mode: 'WALLET',
              status: 'SERVICE_IN_PROGRESS',
              completion_otp: otp,
              wallet_deducted: amount,
              quote_approved_at: nowIso,
            }
          : b
      )
    );
    return { ok: true, paymentMethod: 'WALLET', otp };
  };

  const rejectBill = (bookingId) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.booking_id === bookingId) {
          const isConsult = Boolean(b.isConsultation || b.booking_mode === 'consultation');
          return {
            ...b,
            bill_status: 'REJECTED',
            status: 'ESTIMATE_REJECTED',
            total_bill: isConsult ? 0 : b.total_bill,
            rejected_at: new Date().toISOString(),
          };
        }
        return b;
      })
    );
  };

  const APPLIANCES_VERSION = 'v3-no-default-appliances';
  const APPLIANCES_VERSION_KEY = 'zevota_appliances_version';

  const DEFAULT_INITIAL_APPLIANCES = [];

  const [userAppliances, setUserAppliances] = useState(() => {
    try {
      const storedVersion = localStorage.getItem(APPLIANCES_VERSION_KEY);
      if (storedVersion !== APPLIANCES_VERSION) {
        localStorage.removeItem('zevota_user_appliances');
        localStorage.setItem(APPLIANCES_VERSION_KEY, APPLIANCES_VERSION);
        return [];
      }
      const saved = localStorage.getItem('zevota_user_appliances');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter((a) => a.id !== 101 && a.id !== 102 && a.id !== 103 && a.id !== 104)
            .map((a) => ({
              ...a,
              brand: a.brand || '',
              condition: a.condition || '',
              capacity: a.capacity || '',
              year: a.year || a.age_range || '',
              applianceTypeId: a.applianceTypeId || '',
            }));
        }
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('zevota_user_appliances', JSON.stringify(userAppliances));
    } catch (e) {}
  }, [userAppliances]);

  const getAppliancesForUser = (userOrId) => {
    if (!userOrId) return [];
    let userId = null;
    let userPhone = null;

    if (typeof userOrId === 'object' && userOrId !== null) {
      userId = userOrId.id;
      userPhone = userOrId.phone;
    } else {
      userId = userOrId;
      const u = (users || []).find((usr) => usr.id === userId || String(usr.id) === String(userId));
      if (u) userPhone = u.phone;
    }

    const clean = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');
    const cleanUserPhone = clean(userPhone);

    const matches = (userAppliances || []).filter((a) => {
      if (userId != null && (a.userId === userId || String(a.userId) === String(userId))) return true;
      if (userId != null && (a.user_id === userId || String(a.user_id) === String(userId))) return true;
      if (cleanUserPhone && a.user_phone && clean(a.user_phone) === cleanUserPhone) return true;
      return false;
    });

    return matches;
  };

  const calculateApplianceExtraCharge = (applianceCount = 1) => {
    const extraUnits = Math.max(0, Number(applianceCount || 1) - 1);
    return extraUnits * 499;
  };

  const addUserAppliance = (applianceData) => {
    const newAppliance = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      is_immutable: false,
      createdAt: new Date().toISOString(),
      age_range: applianceData.age_range || applianceData.year || '',
      brand: '',
      ...applianceData,
    };
    setUserAppliances((prev) => [newAppliance, ...prev]);
    if (newAppliance.media && newAppliance.userId) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === newAppliance.userId ? { ...u, property_verification_status: 'PENDING' } : u
        )
      );
      if (activeUser?.id === newAppliance.userId) {
        setActiveUser((prev) => ({ ...prev, property_verification_status: 'PENDING' }));
      }
    }
    return newAppliance;
  };

  const removeUserAppliance = (id) => {
    setUserAppliances((prev) => prev.filter((a) => a.id !== id));
  };

  const updateUserAppliance = (id, updatedFields) => {
    setUserAppliances((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updatedFields } : a))
    );
  };

  const reviewApplianceMedia = (applianceId, status) => {
    setUserAppliances((prev) =>
      prev.map((a) => (a.id === applianceId ? { ...a, mediaStatus: status } : a))
    );
  };

  const verifyPropertyVideo = (userId, status) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, property_verification_status: status } : u))
    );
    if (activeUser?.id === userId) {
      setActiveUser((prev) => ({ ...prev, property_verification_status: status }));
    }
  };

  const registerAmcCoveredAppliances = (selectedList = [], planName = 'Gold') => {
    if (!activeUser || !Array.isArray(selectedList)) return;
    const nowIso = new Date().toISOString();
    const selectedIds = new Set(
      selectedList.map((item) => (typeof item === 'object' && item?.id ? String(item.id) : String(item)))
    );

    setUserAppliances((prev) => {
      const updated = prev.map((app) => {
        const belongsToUser =
          app.userId === activeUser.id ||
          String(app.userId) === String(activeUser.id) ||
          app.user_id === activeUser.id ||
          String(app.user_id) === String(activeUser.id);
        if (!belongsToUser) return app;

        if (selectedIds.has(String(app.id))) {
          return {
            ...app,
            isCoveredByAmc: true,
            coveredPlanTier: planName,
            linkedAtPlanPurchase: true,
            amcLinkedAt: nowIso,
          };
        }
        return app;
      });

      const existingIds = new Set(updated.map((a) => String(a.id)));
      const brandNew = selectedList
        .filter((item) => typeof item === 'object' && item !== null && (!item.id || !existingIds.has(String(item.id))))
        .map((item) => ({
          id: item.id || Date.now() + Math.floor(Math.random() * 1000),
          userId: activeUser.id,
          user_id: activeUser.id,
          user_phone: activeUser.phone,
          isCoveredByAmc: true,
          coveredPlanTier: planName,
          linkedAtPlanPurchase: true,
          amcLinkedAt: nowIso,
          ...item,
        }));

      const finalAppliances = [...brandNew, ...updated];
      try {
        localStorage.setItem('zevota_user_appliances', JSON.stringify(finalAppliances));
      } catch (e) {}
      return finalAppliances;
    });
  };

  const purchaseSubscription = (plan, txId, coveredAppliances = []) => {
    if (!activeUser || !plan) return;

    const finalTxId = txId || `TX-${Math.floor(100000 + Math.random() * 900000)}`;
    const balanceBefore = Number(activeUser.wallet_balance || 0);
    const credit = Number(plan.wallet_credit || 0);
    // Add plan credit on top of remaining balance (do not wipe leftover funds)
    const newBal = balanceBefore + credit;
    const months = Number(plan.validity_months || 12);
    const expires = new Date();
    expires.setMonth(expires.getMonth() + months);
    const nowIso = new Date().toISOString();

    const contractNo = activeUser.amc_contract_number || `AMC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const theme = getPlanTheme(plan.name);

    const updatedUser = {
      ...activeUser,
      subscription_plan: plan.name,
      subscription_status: 'ACTIVE',
      amc_contract_number: contractNo,
      amc_start_date: nowIso,
      amc_expiry_date: expires.toISOString(),
      amc_preventive_remaining: theme.preventiveVisits || 2,
      amc_parts_allowance_remaining: theme.partsCap || credit,
      wallet_balance: newBal,
      wallet_original_balance: Number(activeUser.wallet_original_balance || 0) + credit,
      subscription_expires_at: expires.toISOString(),
      subscription_started_at: nowIso,
    };

    setActiveUser(updatedUser);
    localStorage.setItem('zevota_active_user', JSON.stringify(updatedUser));

    if (Array.isArray(coveredAppliances) && coveredAppliances.length > 0) {
      registerAmcCoveredAppliances(coveredAppliances, plan.name);
    }

    const newTx = {
      transaction_id: finalTxId,
      userId: activeUser.id,
      user_phone: activeUser.phone,
      type: 'AMC_PURCHASE',
      category: 'Plans',
      amount: credit,
      balance_before: balanceBefore,
      balance_after: newBal,
      description: `Activated ${plan.name} AMC Contract (#${contractNo}) with 365 days coverage`,
      plan_name: plan.name,
      amc_contract_number: contractNo,
      created_at: nowIso,
    };

    setWallet((prev) => {
      const updatedWallet = {
        balance: newBal,
        transactions: [newTx, ...(prev?.transactions || [])],
      };
      localStorage.setItem('zevota_wallet', JSON.stringify(updatedWallet));
      return updatedWallet;
    });

    setUsers((prev) => {
      const updatedUsers = prev.map((u) =>
        u.id === activeUser.id
          ? {
              ...u,
              subscription_plan: plan.name,
              subscription_status: 'ACTIVE',
              wallet_balance: newBal,
              wallet_original_balance: Number(activeUser.wallet_original_balance || 0) + credit,
              subscription_expires_at: expires.toISOString(),
              subscription_started_at: nowIso,
            }
          : u
      );
      localStorage.setItem('zevota_users', JSON.stringify(updatedUsers));
      return updatedUsers;
    });
  };

  const topUpWallet = (amount) => {
    if (!activeUser || activeUser.isGuest || activeUser.id === 0 || activeUser.name === 'Guest User') {
      return { ok: false, error: 'Registration required to top up wallet.' };
    }
    const credit = Number(amount);
    if (!Number.isFinite(credit) || credit <= 0) return { ok: false, error: 'Invalid amount.' };
    const balanceBefore = Number(activeUser.wallet_balance || 0);
    const newBal = balanceBefore + credit;
    const nowIso = new Date().toISOString();
    const updatedUser = {
      ...activeUser,
      wallet_balance: newBal,
      wallet_original_balance: Number(activeUser.wallet_original_balance || balanceBefore) + credit,
    };
    setActiveUser(updatedUser);
    try {
      localStorage.setItem('zevota_active_user', JSON.stringify(updatedUser));
    } catch (e) {}
    setUsers((prev) => {
      const next = prev.map((u) =>
        u.id === activeUser.id
          ? { ...u, wallet_balance: newBal, wallet_original_balance: updatedUser.wallet_original_balance }
          : u
      );
      try {
        localStorage.setItem('zevota_users', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    const newTx = {
      transaction_id: `TX-TOPUP-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: activeUser.id,
      user_phone: activeUser.phone,
      type: 'WALLET_CREDIT',
      category: 'Plans',
      amount: credit,
      balance_before: balanceBefore,
      balance_after: newBal,
      description: `Parts Allowance Top-Up of ₹${credit.toLocaleString('en-IN')}`,
      created_at: nowIso,
    };
    setWallet((prev) => {
      const updatedWallet = {
        balance: newBal,
        transactions: [newTx, ...(prev?.transactions || [])],
      };
      try {
        localStorage.setItem('zevota_wallet', JSON.stringify(updatedWallet));
      } catch (e) {}
      return updatedWallet;
    });
    return { ok: true, balance: newBal };
  };

  return (
    <AppContext.Provider
      value={{
        activeApp,
        setActiveApp,
        activeUser,
        setActiveUser,
        adminUser,
        setAdminUser,
        logoutAdmin,
        activeProvider,
        setActiveProvider,
        subscriptionPlans,
        setSubscriptionPlans,
        categories,
        setCategories,
        subCategories,
        setSubCategories,
        services,
        setServices,
        bookings,
        getUserBookings,
        bookingBelongsToUser,
        wallet,
        activeAmc,
        users,
        activeProvider,
        setActiveProvider,
        logoutProvider,
        providers,
        setProviders,
        banners,
        setBanners,
        chats,
        setChats,
        findUserByPhone,
        registerUser,
        loginUser,
        loginGuestUser,
        skipAuth,
        makeGuestUser: _makeGuestUser,
        logoutUser,
        updateProfile,
        createBooking,
        acceptBooking,
        rejectBooking,
        assignProvider,
        submitInspectionReport,
        updateBookingStatus,
        uploadBookingMedia,
        generateBill,
        approveBill,
        rejectBill,
        verifyPropertyVideo,
        purchaseSubscription,
        registerAmcCoveredAppliances,
        topUpWallet,
        userAppliances,
        getAppliancesForUser,
        addUserAppliance,
        removeUserAppliance,
        updateUserAppliance,
        reviewApplianceMedia,
        serviceAreas,
        setServiceAreas,
        validateServiceLocation,
        addServiceArea,
        updateServiceArea,
        toggleServiceAreaStatus,
        deleteServiceArea,
        submitBookingRating,
        skipBookingRating,
        updateProviderLocation,
        calculateApplianceExtraCharge,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
