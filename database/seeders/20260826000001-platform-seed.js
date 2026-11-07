/**
 * Comprehensive Seeder for Zevota Care PRD Platform
 */

import { hashPassword } from '../../app/utils/password.js';

export default {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Users
    await queryInterface.bulkInsert('users', [
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        phone: '+91 98765 43210',
        role: 'user',
        wallet_balance: 500000.0,
        subscription_plan: 'Gold',
        subscription_status: 'ACTIVE',
        property_video_url: '/sample-video.mp4',
        property_verification_status: 'APPROVED',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Priya Verma',
        email: 'priya.verma@example.com',
        phone: '+91 98123 45678',
        role: 'user',
        wallet_balance: 100000.0,
        subscription_plan: 'Silver',
        subscription_status: 'ACTIVE',
        property_video_url: '/sample-video.mp4',
        property_verification_status: 'PENDING',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
    ]);

    // 2. Providers (5 Canonical Categories)
    await queryInterface.bulkInsert('providers', [
      {
        name: 'Rajesh Sharma',
        phone: '+91 99887 76655',
        email: 'rajesh.electrician@zevotacare.com',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
        categories_json: JSON.stringify(['Electrician']),
        services_json: JSON.stringify(['Fan Repair & Fitting', 'Wiring & MCB Repair', 'Switch & Socket Replacement', 'Geyser Installation']),
        rating: 4.9,
        total_jobs: 142,
        earnings: 128500.0,
        is_online: true,
        status: 'APPROVED',
        location: 'DLF Cyber City, Sector 24, Gurugram',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Suresh Kumar',
        phone: '+91 98989 12345',
        email: 'suresh.plumber@zevotacare.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        categories_json: JSON.stringify(['Plumbing']),
        services_json: JSON.stringify(['Tap & Mixer Repair', 'Pipe Leakage Fix', 'Drain Blockage Removal', 'Water Tank Cleaning']),
        rating: 4.8,
        total_jobs: 98,
        earnings: 84000.0,
        is_online: true,
        status: 'APPROVED',
        location: 'Sohna Road, Sector 48, Gurugram',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Vikram Singh',
        phone: '+91 98112 33445',
        email: 'vikram.carpenter@zevotacare.com',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        categories_json: JSON.stringify(['Carpentry']),
        services_json: JSON.stringify(['Door Lock & Handle', 'Cupboard & Drawer Repair', 'Furniture Assembly', 'Bed & Table Repair']),
        rating: 4.9,
        total_jobs: 116,
        earnings: 96000.0,
        is_online: true,
        status: 'APPROVED',
        location: 'Golf Course Road, Sector 54, Gurugram',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Amit Yadav',
        phone: '+91 98223 44556',
        email: 'amit.pestcontrol@zevotacare.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        categories_json: JSON.stringify(['Pest Control']),
        services_json: JSON.stringify(['Cockroach Pest Control', 'Termite Treatment', 'Bedbug Eradication', 'General Pest Spray']),
        rating: 4.8,
        total_jobs: 84,
        earnings: 72000.0,
        is_online: true,
        status: 'APPROVED',
        location: 'Sector 56, Huda Colony, Gurugram',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Meena Devi',
        phone: '+91 98334 55667',
        email: 'meena.drycleaning@zevotacare.com',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
        categories_json: JSON.stringify(['Dry Cleaning']),
        services_json: JSON.stringify(['Sofa Deep Cleaning', 'Carpet Dry Cleaning', 'Curtain Steam Clean', 'Mattress Sanitization']),
        rating: 4.9,
        total_jobs: 130,
        earnings: 112000.0,
        is_online: true,
        status: 'APPROVED',
        location: 'DLF Phase 3, Gurugram',
        created_at: now,
        updated_at: now,
      },
    ]);

    // 3. Subscription Plans
    await queryInterface.bulkInsert('subscription_plans', [
      {
        name: 'Silver',
        price: 100000.0,
        wallet_credit: 100000.0,
        validity_months: 12,
        applicable_services: 'All Electrical & Plumbing Services',
        service_limits: '12 Visits per year',
        description: 'Ideal for standard apartment maintenance & basic home care.',
        features_json: JSON.stringify([
          '₹1,00,000 Prepaid Service Wallet Credit',
          'Free Home Inspection',
          'Priority Provider Assignment within 4 Hours',
          '100% Genuine Spare Parts Warranty',
        ]),
        is_recommended: false,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Gold',
        price: 500000.0,
        wallet_credit: 500000.0,
        validity_months: 12,
        applicable_services: 'All Services (Electrical, Plumbing, AC, Appliances)',
        service_limits: 'Unlimited Visits',
        description: 'Best seller for premium villas & large luxury homes.',
        features_json: JSON.stringify([
          '₹5,00,000 Prepaid Service Wallet Credit',
          'Dedicated Account & Service Manager',
          'Express 1-Hour Emergency Provider Arrival',
          'Complimentary Quarterly Deep AC Servicing',
          'Zero Inspection Fee Always',
        ]),
        is_recommended: true,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Platinum',
        price: 1000000.0,
        wallet_credit: 1000000.0,
        validity_months: 24,
        applicable_services: 'All Comprehensive Home Maintenance & Upgrades',
        service_limits: 'Unlimited Priority Visits',
        description: 'Ultimate VIP protection for high-value properties.',
        features_json: JSON.stringify([
          '₹10,00,000 Prepaid Service Wallet Credit',
          '24/7 VIP Concierge & Master Technicians',
          'Immediate 30-Minute Dispatch Guarantee',
          'Full Property Annual Video Audit',
          '10% Bonus Cashback on Wallet Top-ups',
        ]),
        is_recommended: false,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
    ]);

    // 4. Categories
    await queryInterface.bulkInsert('categories', [
      {
        id: 1,
        name: 'Electrical',
        description: 'Wiring, fixtures, appliances, switches & kitchen power',
        image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        name: 'Plumbing',
        description: 'Tap repair, pipe leaks, bathroom fixtures & drainage',
        image_url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=400',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        name: 'AC Services',
        description: 'AC maintenance, gas refilling, cooling repair & installation',
        image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=400',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
    ]);

    // 5. SubCategories
    await queryInterface.bulkInsert('sub_categories', [
      {
        id: 1,
        category_id: 1,
        name: 'Kitchen Electrical',
        description: 'Mixers, chimneys, microwaves & kitchen appliances',
        image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=400',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        category_id: 1,
        name: 'Home Electrical',
        description: 'Main switchboards, MCBs, lightings & ceiling fans',
        image_url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&q=80&w=400',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        category_id: 2,
        name: 'Bathroom Plumbing',
        description: 'Basin taps, showers, flush tanks & drain cleaning',
        image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        id: 4,
        category_id: 3,
        name: 'AC Maintenance',
        description: 'Split & window AC servicing, deep wash & gas refill',
        image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=400',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
    ]);

    // 6. Services
    await queryInterface.bulkInsert('services', [
      {
        id: 1,
        category_id: 1,
        sub_category_id: 1,
        name: 'Mixer Repair',
        description: 'Diagnosis of motor noise, blade replacement, jar coupler & wiring repair.',
        image_url: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&q=80&w=400',
        pricing_model: 'INSPECTION_BASED',
        base_price: 2000.0,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        category_id: 1,
        sub_category_id: 2,
        name: 'Switch Repair',
        description: 'Repair and replacement of burnt switches, socket boards & indicator lights.',
        image_url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&q=80&w=400',
        pricing_model: 'FIXED',
        base_price: 499.0,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        category_id: 2,
        sub_category_id: 3,
        name: 'Tap Repair',
        description: 'Leakage fixing, washer change & faucet installation.',
        image_url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=400',
        pricing_model: 'FIXED',
        base_price: 349.0,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        id: 4,
        category_id: 3,
        sub_category_id: 4,
        name: 'AC Gas Refill',
        description: 'Complete coolant leak test, pressure check & eco-friendly gas top-up.',
        image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=400',
        pricing_model: 'INSPECTION_BASED',
        base_price: 2500.0,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
    ]);

    // 7. Banners
    await queryInterface.bulkInsert('banners', [
      {
        title: 'Unlimited Home Maintenance',
        description: 'Subscribe to Gold Plan & get ₹5,00,000 Service Wallet Credit + 1-Hour Emergency Dispatch.',
        image_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=1000',
        cta: 'Upgrade Plan',
        redirect_type: 'SUBSCRIPTION',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        title: 'Monsoon Electrical Inspection',
        description: 'Get 100% free switchboard safety check with any active booking.',
        image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=1000',
        cta: 'Book Electrical',
        redirect_type: 'CATEGORY',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
    ]);

    // 8. Sub-Admins (category-scoped admin accounts)
    const defaultPassword = await hashPassword('subadmin123');
    await queryInterface.bulkInsert('sub_admins', [
      {
        name: 'Anil Verma',
        email: 'anil@zevotacare.com',
        password_hash: defaultPassword,
        phone: '+91 98111 22001',
        assigned_categories: JSON.stringify(['Electrician']),
        permissions: JSON.stringify({
          can_dispatch_partners: true,
          can_approve_estimates: true,
          can_manage_catalog_rates: false,
          can_resolve_complaints: true,
        }),
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Sunil Sharma',
        email: 'sunil@zevotacare.com',
        password_hash: defaultPassword,
        phone: '+91 98111 22002',
        assigned_categories: JSON.stringify(['Plumbing']),
        permissions: JSON.stringify({
          can_dispatch_partners: true,
          can_approve_estimates: true,
          can_manage_catalog_rates: true,
          can_resolve_complaints: false,
        }),
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Ramesh Gupta',
        email: 'ramesh@zevotacare.com',
        password_hash: defaultPassword,
        phone: '+91 98111 22003',
        assigned_categories: JSON.stringify(['Carpentry']),
        permissions: JSON.stringify({
          can_dispatch_partners: true,
          can_approve_estimates: false,
          can_manage_catalog_rates: false,
          can_resolve_complaints: true,
        }),
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Deepak Mehta',
        email: 'deepak@zevotacare.com',
        password_hash: defaultPassword,
        phone: '+91 98111 22004',
        assigned_categories: JSON.stringify(['Pest Control']),
        permissions: JSON.stringify({
          can_dispatch_partners: true,
          can_approve_estimates: true,
          can_manage_catalog_rates: true,
          can_resolve_complaints: true,
        }),
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Pooja Kulkarni',
        email: 'pooja@zevotacare.com',
        password_hash: defaultPassword,
        phone: '+91 98111 22005',
        assigned_categories: JSON.stringify(['Dry Cleaning']),
        permissions: JSON.stringify({
          can_dispatch_partners: true,
          can_approve_estimates: true,
          can_manage_catalog_rates: false,
          can_resolve_complaints: true,
        }),
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('sub_admins', null, {});
    await queryInterface.bulkDelete('banners', null, {});
    await queryInterface.bulkDelete('services', null, {});
    await queryInterface.bulkDelete('sub_categories', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('subscription_plans', null, {});
    await queryInterface.bulkDelete('providers', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
