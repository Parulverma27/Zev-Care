/**
 * Pre-trained Knowledge Base for Zevota Care Live Support.
 * Covers 8 domains, 30+ intents, multi-keyword patterns & Hinglish triggers.
 */

export const SUPPORT_CATEGORIES = [
  { id: 'BOOKINGS', label: 'Bookings & Tracking', icon: 'clock' },
  { id: 'DIAGNOSIS_PRICING', label: 'Diagnosis & Pricing', icon: 'zap' },
  { id: 'AMC_PLANS', label: 'AMC Care Plans', icon: 'shield' },
  { id: 'WALLET_PAYMENTS', label: 'Wallet & Invoices', icon: 'credit-card' },
  { id: 'REFUNDS_DISPUTES', label: 'Refunds & Guarantee', icon: 'alert-circle' },
  { id: 'SAFETY_TECHNICIANS', label: 'Technician Safety', icon: 'user-check' },
  { id: 'COVERAGE_ZONES', label: 'Cities & Coverage', icon: 'map-pin' },
  { id: 'HUMAN_ESCALATION', label: 'Live Executive Desk', icon: 'headphones' },
];

export const PRETRAINED_INTENTS = [
  // ── 1. BOOKINGS & TRACKING ──
  {
    id: 'track_technician',
    category: 'BOOKINGS',
    title: 'Track My Technician / Location',
    patterns: [
      /where\s+(is|are)\s+(my\s+)?(technician|partner|plumber|electrician|carpenter|mechanic)/i,
      /track(\s+(my\s+)?(technician|partner|plumber|electrician|booking|order))?/i,
      /location\s+of\s+technician/i,
      /kab\s+(aayega|pahuchega|aa\s+raha)/i,
      /technician\s+kaha\s+hai/i,
      /eta\s+(for\s+technician|arrival)?/i,
      /when\s+will\s+(he|technician|plumber)\s+arrive/i,
      /running\s+late/i,
    ],
    answer:
      '📍 **Live Technician Status for {USER_NAME}:**\nYour technician **{TECHNICIAN_NAME}** is assigned to booking **{BOOKING_ID}** for **{SERVICE_NAME}**.\n\n• **Status:** {BOOKING_STATUS}\n• **Scheduled Time:** {SCHEDULED_TIME}\n• **Arrival OTP:** {OTP}\n\nYou can track their live location in real time on the interactive map.',
    fallbackAnswer:
      '📍 You do not have any active ongoing service visit right now. Once you book a service and our dispatcher assigns a verified technician, you will receive live GPS tracking and arrival updates right here.',
    requiresBooking: true,
    actionLink: '/user/bookings',
    actionText: 'Track Active Booking →',
    relatedQuestions: [
      'What is my completion OTP?',
      'How to reschedule a booking?',
      'Can I call the technician directly?',
    ],
  },
  {
    id: 'completion_otp',
    category: 'BOOKINGS',
    title: 'Service Completion OTP',
    patterns: [
      /completion\s+otp/i,
      /what\s+is\s+(my\s+)?otp/i,
      /service\s+otp/i,
      /pin\s+for\s+technician/i,
      /otp\s+kya\s+hai/i,
      /security\s+pin/i,
    ],
    answer:
      '🔐 **Your Secure Completion OTP is: {OTP}**\n\nFor your safety, only share this 4-digit code with **{TECHNICIAN_NAME}** after the service work has been inspected and completed to your 100% satisfaction.',
    fallbackAnswer:
      '🔐 A secure 4-digit Completion OTP is automatically generated for every active booking order. It is displayed at the top of your Booking Details screen and should only be shared once the technician finishes the service.',
    requiresBooking: true,
    actionLink: '/user/bookings',
    actionText: 'View My Booking Details →',
    relatedQuestions: [
      'Track my technician',
      'What if the issue is not resolved?',
      'How to pay my service bill?',
    ],
  },
  {
    id: 'reschedule_booking',
    category: 'BOOKINGS',
    title: 'Reschedule an Appointment',
    patterns: [
      /reschedule/i,
      /change\s+(date|time|slot)/i,
      /postpone\s+(visit|service|booking)/i,
      /time\s+change\s+karna/i,
      /shift\s+booking/i,
    ],
    answer:
      '📅 **Rescheduling is 100% Free** up to 2 hours prior to your scheduled slot.\n\nTo pick a new convenient time slot:\n1. Open **My Bookings**\n2. Select your active order\n3. Tap **Reschedule Slot** and select your preferred day & hour.',
    fallbackAnswer:
      '📅 You can reschedule any confirmed service visit for free up to 2 hours before arrival directly from your Booking Details page.',
    actionLink: '/user/bookings',
    actionText: 'Go to My Bookings →',
    relatedQuestions: [
      'Cancellation & Refund terms',
      'Track my technician',
      'What are your emergency response hours?',
    ],
  },
  {
    id: 'cancel_booking',
    category: 'BOOKINGS',
    title: 'Cancel Booking & Cancellation Fee',
    patterns: [
      /cancel(\s+(my\s+)?booking)?/i,
      /cancel\s+karna\s+hai/i,
      /cancellation\s+(policy|fee|charges)/i,
      /stop\s+service/i,
    ],
    answer:
      '🛑 **Cancellation Policy:**\n• **More than 2 hours before slot:** 100% Free cancellation with instant wallet refund.\n• **Within 2 hours of arrival:** A nominal ₹99 dispatch convenience fee applies to compensate the dispatched technician for transit fuel.\n\nYou can cancel anytime from your booking card.',
    actionLink: '/user/bookings',
    actionText: 'Manage My Bookings →',
    relatedQuestions: [
      'How do refunds work?',
      'How to reschedule a booking?',
      'How to use wallet credits?',
    ],
  },
  {
    id: 'book_service',
    category: 'BOOKINGS',
    title: 'How to Book a New Service',
    patterns: [
      /how\s+to\s+book/i,
      /new\s+booking/i,
      /service\s+chahiye/i,
      /order\s+a\s+plumber/i,
      /book\s+electrician/i,
      /book\s+ac\s+repair/i,
    ],
    answer:
      '🛠️ **Booking a Service takes under 60 seconds:**\n1. Select your appliance or service category (AC, Electrical, Plumbing, Appliances, etc.).\n2. Choose a ₹0 On-Site Diagnosis or specific repair service.\n3. Select your address and convenient time slot.\n4. A certified field technician will be dispatched to your doorstep.',
    actionLink: '/user/services',
    actionText: 'Browse All Services →',
    relatedQuestions: [
      'Is on-site inspection really ₹0?',
      'What services do you offer?',
      'What are the AMC Care Plans?',
    ],
  },

  // ── 2. DIAGNOSIS & PRICING ──
  {
    id: 'zero_diagnosis',
    category: 'DIAGNOSIS_PRICING',
    title: 'Is Diagnosis / Inspection Really ₹0?',
    patterns: [
      /is\s+(inspection|diagnosis)\s+free/i,
      /free\s+(inspection|diagnosis|visit)/i,
      /0\s*(rupee|rs|inr)?\s*(diagnosis|inspection)/i,
      /visiting\s+(charge|fee)/i,
      /hidden\s+(charges|cost)/i,
      /koi\s+charge\s+hai\s+kya/i,
    ],
    answer:
      '✨ **Yes, 100% Guaranteed ₹0 Doorstep Diagnosis!**\n\nOur certified technician arrives at your premises, inspects the fault, tests all components with digital tools, and gives you a transparent upfront quotation. If you choose not to proceed with the repair, you pay **₹0 visiting charges**.',
    actionLink: '/user/consultation',
    actionText: 'Book ₹0 Diagnosis Now →',
    relatedQuestions: [
      'How are spare parts priced?',
      'What if I decline the quote?',
      'What services do you offer?',
    ],
  },
  {
    id: 'spare_parts_cost',
    category: 'DIAGNOSIS_PRICING',
    title: 'Spare Parts Pricing & Genuine Guarantee',
    patterns: [
      /spare\s+parts?\s+(cost|price|charges)/i,
      /genuine\s+parts/i,
      /parts\s+guarantee/i,
      /duplicate\s+parts/i,
      /saman\s+ka\s+kharcha/i,
    ],
    answer:
      '🔩 **100% Genuine OEM Spare Parts Guarantee:**\n• Technicians use only sealed, certified OEM replacement parts.\n• You receive an itemized digital estimate with part MRPs before any part is installed.\n• All replaced spare parts carry a **90-day parts replacement warranty**.',
    relatedQuestions: [
      'Is on-site inspection really ₹0?',
      'How to use wallet credits?',
      'What is covered in AMC plans?',
    ],
  },
  {
    id: 'estimate_approval',
    category: 'DIAGNOSIS_PRICING',
    title: 'How Upfront Estimates & Billing Work',
    patterns: [
      /how\s+to\s+approve\s+estimate/i,
      /quote\s+approval/i,
      /bill\s+approval/i,
      /accept\s+quotation/i,
      /extra\s+charges/i,
    ],
    answer:
      '📋 **No Surprise Billing:**\nAfter diagnosing the issue, the technician submits a digital inspection report with labor and parts breakdown. You get an in-app approval prompt. Work only begins after you tap **Approve Estimate**. You can also reject the estimate with zero penalty.',
    relatedQuestions: [
      'Is on-site inspection really ₹0?',
      'How to use wallet credits?',
      'Cancellation & Refund terms',
    ],
  },

  // ── 3. AMC CARE PLANS ──
  {
    id: 'amc_coverage',
    category: 'AMC_PLANS',
    title: 'AMC Care Plans & What Is Covered',
    patterns: [
      /what\s+is\s+amc/i,
      /amc\s+(coverage|plans?|benefits)/i,
      /annual\s+maintenance/i,
      /silver\s+vs\s+gold/i,
      /care\s+plans?/i,
      /membership/i,
    ],
    answer:
      '🏆 **Zevota VIP Care AMC Plans:**\n\n• **Silver Plan (₹1,00,000/yr):** 2 Free Preventive Maintenance visits, 100% Free Labor on all breakdown repairs, and ₹15,000 spare parts protection allowance.\n• **Gold Comprehensive (₹5,00,000/yr):** 4 Free Preventive visits, Unlimited 2-Hour Priority breakdown visits, and ₹40,000 spare parts protection cap.\n• **Platinum Villa (₹10,00,000/2yr):** 6 visits, ₹1,00,000 spare parts cap, dedicated relationship manager.',
    actionLink: '/user/subscription-plans',
    actionText: 'Explore AMC Care Plans →',
    relatedQuestions: [
      'Check my active AMC status',
      'Can I register multiple appliances in AMC?',
      'How to use wallet credits?',
    ],
  },
  {
    id: 'amc_my_status',
    category: 'AMC_PLANS',
    title: 'Check My Active AMC Contract & Visits',
    patterns: [
      /my\s+amc/i,
      /active\s+plan/i,
      /visits\s+left/i,
      /how\s+many\s+visits/i,
      /plan\s+expiry/i,
      /contract\s+number/i,
    ],
    answer:
      '🛡️ **Your AMC Membership Details ({USER_NAME}):**\n• **Active Plan:** {PLAN_NAME}\n• **Contract No:** {CONTRACT_NO}\n• **Preventive Visits Left:** {VISITS_LEFT} of {TOTAL_VISITS}\n• **Spare Parts Allowance Left:** ₹{PARTS_LEFT}\n• **Priority SLA:** {SLA_HOURS}-Hour Dispatch',
    fallbackAnswer:
      '🛡️ You currently do not have an active AMC Care Plan. With an Annual Maintenance Contract, you receive free preventive visits, unlimited ₹0 labor breakdown calls, and spare parts protection caps.',
    requiresPlan: true,
    actionLink: '/user/amc',
    actionText: 'View My AMC Dashboard →',
    relatedQuestions: [
      'What is covered in AMC plans?',
      'Can I register multiple appliances in AMC?',
      'Book a preventive visit',
    ],
  },
  {
    id: 'amc_add_appliances',
    category: 'AMC_PLANS',
    title: 'Registering Appliances Under AMC',
    patterns: [
      /register\s+appliance/i,
      /add\s+(ac|refrigerator|washing\s+machine)\s+to\s+amc/i,
      /how\s+many\s+appliances/i,
      /appliance\s+limit/i,
    ],
    answer:
      '❄️ **Appliance Registration:**\nUnder Zevota Care AMC, you can register **unlimited appliances** in your household (Split ACs, Window ACs, Refrigerators, RO Water Purifiers, Washing Machines, Microwave Ovens, Geysers). Simply upload a short 10-second inspection video for instant verification.',
    actionLink: '/user/appliances',
    actionText: 'Manage My Appliances →',
    relatedQuestions: [
      'Check my active AMC status',
      'What is covered in AMC plans?',
      'Is on-site inspection really ₹0?',
    ],
  },

  // ── 4. WALLET, PAYMENTS & INVOICES ──
  {
    id: 'wallet_balance',
    category: 'WALLET_PAYMENTS',
    title: 'Check Wallet Balance & Credits',
    patterns: [
      /wallet\s+balance/i,
      /check\s+(my\s+)?wallet/i,
      /how\s+much\s+(credit|money|balance)/i,
      /wallet\s+me\s+kitna\s+hai/i,
      /my\s+balance/i,
    ],
    answer:
      '💳 **Current Zevota Wallet Balance for {USER_NAME}:**\n**₹{WALLET_BAL}**\n\nYour wallet credits can be seamlessly applied toward any doorstep repair service or spare parts bill.',
    actionLink: '/user/wallet',
    actionText: 'Open My Wallet →',
    relatedQuestions: [
      'How to use wallet credits?',
      'How to add money to wallet?',
      'Download PDF invoice',
    ],
  },
  {
    id: 'wallet_usage',
    category: 'WALLET_PAYMENTS',
    title: 'How to Use Wallet Credits on Bills',
    patterns: [
      /how\s+to\s+use\s+wallet/i,
      /apply\s+wallet/i,
      /wallet\s+se\s+payment/i,
      /pay\s+from\s+wallet/i,
    ],
    answer:
      '💰 **Automatic Wallet Deduction:**\nWhen your technician completes the inspection and generates your service bill, the system automatically applies your available wallet balance at checkout. You only pay any remaining difference via UPI or card.',
    actionLink: '/user/wallet',
    actionText: 'View Wallet Transactions →',
    relatedQuestions: [
      'Check wallet balance',
      'Payment modes accepted',
      'Download PDF invoice',
    ],
  },
  {
    id: 'download_invoice',
    category: 'WALLET_PAYMENTS',
    title: 'Download GST Invoice / Bill Receipt',
    patterns: [
      /invoice/i,
      /receipt/i,
      /bill\s+(pdf|download|copy)/i,
      /gst\s+bill/i,
      /bill\s+chahiye/i,
    ],
    answer:
      '📄 **Download Tax Invoice:**\nOfficial GST invoices with itemized parts breakdown and warranty terms are available immediately after payment.\n\n1. Go to **My Bookings**\n2. Open your completed booking\n3. Tap **Download PDF Invoice**.',
    actionLink: '/user/bookings',
    actionText: 'View Past Invoices →',
    relatedQuestions: [
      'Check wallet balance',
      'How are spare parts priced?',
      'What is your warranty policy?',
    ],
  },
  {
    id: 'payment_modes',
    category: 'WALLET_PAYMENTS',
    title: 'Accepted Payment Methods',
    patterns: [
      /payment\s+methods?/i,
      /payment\s+options?/i,
      /upi/i,
      /google\s*pay|phonepe|paytm/i,
      /credit\s+card|debit\s+card/i,
      /cash\s+on\s+delivery|cod/i,
    ],
    answer:
      '💳 **Supported Payment Modes:**\n• Zevota Wallet Credits (Instant 1-Click)\n• UPI (Google Pay, PhonePe, Paytm, BHIM)\n• Credit & Debit Cards (Visa, MasterCard, RuPay)\n• NetBanking across all major Indian banks\n• Secure Razorpay Checkout with end-to-end encryption.',
    relatedQuestions: [
      'How to use wallet credits?',
      'Download PDF invoice',
      'Is inspection really ₹0?',
    ],
  },

  // ── 5. REFUNDS & WORKMANSHIP WARRANTY ──
  {
    id: 'refund_policy',
    category: 'REFUNDS_DISPUTES',
    title: 'Refund Policy & Timeline',
    patterns: [
      /refund\s+(policy|timeline|time)/i,
      /money\s+back/i,
      /paise\s+kab\s+wapas/i,
      /refund\s+kitne\s+din/i,
      /where\s+is\s+my\s+refund/i,
    ],
    answer:
      '💸 **Refund Processing Timelines:**\n• **Wallet Credit Refunds:** Instant (reflected within 5 seconds).\n• **Bank / UPI / Card Refunds:** Initiated immediately; credits into your source account within 3–5 business days depending on your bank.',
    actionLink: '/user/wallet',
    actionText: 'Check Wallet Ledger →',
    relatedQuestions: [
      'Cancellation & Refund terms',
      'What is your 30-day warranty?',
      'How to raise a dispute?',
    ],
  },
  {
    id: 'workmanship_warranty',
    category: 'REFUNDS_DISPUTES',
    title: '30-Day Workmanship Repair Guarantee',
    patterns: [
      /warranty/i,
      /guarantee/i,
      /what\s+if\s+problem\s+occurs\s+again/i,
      /issue\s+not\s+fixed/i,
      /dobara\s+kharab\s+ho\s+gaya/i,
      /repair\s+guarantee/i,
    ],
    answer:
      '🛡️ **30-Day Zevota Workmanship Guarantee:**\nIf the same fault reoccurs within 30 days of service completion, a senior technician will revisit your premises and rectify the defect with **₹0 labor and ₹0 service charge guaranteed**.',
    relatedQuestions: [
      'How to raise a dispute?',
      'How are spare parts priced?',
      'Speak with a Live Executive',
    ],
  },
  {
    id: 'dispute_raise',
    category: 'REFUNDS_DISPUTES',
    title: 'Raise a Service Complaint or Dispute',
    patterns: [
      /complaint/i,
      /raise\s+(a\s+)?dispute/i,
      /bad\s+service/i,
      /damage\s+by\s+technician/i,
      /unhappy\s+with\s+service/i,
      /sikayat/i,
    ],
    answer:
      '⚠️ **Customer Grievance & Escalation:**\nWe take service quality very seriously. Your concern has been flagged to our Customer Experience Directorate. You can also file a formal dispute directly against your booking order.',
    actionLink: '/user/bookings',
    actionText: 'Select Booking to Report →',
    relatedQuestions: [
      'Speak with a Live Executive',
      'What is your 30-day warranty?',
      'Refund policy & timeline',
    ],
  },

  // ── 6. TECHNICIAN SAFETY & DECORUM ──
  {
    id: 'technician_safety',
    category: 'SAFETY_TECHNICIANS',
    title: 'Technician Background Checks & Verification',
    patterns: [
      /background\s+check/i,
      /police\s+verification/i,
      /is\s+(technician|plumber)\s+safe/i,
      /verified\s+pro/i,
      /safe\s+for\s+home/i,
      /id\s+card/i,
    ],
    answer:
      '🛡️ **100% Certified & Background Checked:**\n• Every technician undergoes government Aadhaar verification and local police background clearance.\n• Mandatory 50+ hours technical assessment and decorum training.\n• Arrives in verified uniform with Zevota ID badge and digital tools.',
    relatedQuestions: [
      'What services do you offer?',
      'Track my technician',
      'Is on-site inspection really ₹0?',
    ],
  },

  // ── 7. COVERAGE CITIES & ZONES ──
  {
    id: 'service_pincodes',
    category: 'COVERAGE_ZONES',
    title: 'Service Coverage Areas & Cities',
    patterns: [
      /cities\s+covered/i,
      /service\s+in\s+my\s+area/i,
      /mumbai|gurugram|gurgaon|jaipur/i,
      /pincode\s+coverage/i,
      /kaha\s+kaha\s+service\s+hai/i,
    ],
    answer:
      '📍 **Active Coverage Hubs (2-Hour Dispatch Guarantee):**\n• **Mumbai Metro:** Bandra, BKC, Juhu, Andheri, Powai, Worli, Tardeo & suburbs.\n• **Gurugram / Delhi NCR:** DLF Cyber City, Golf Course Road, Sohna Road & tech corridors.\n• **Jaipur Central:** C-Scheme, Vaishali Nagar, Malviya Nagar & Raja Park.',
    actionLink: '/user/services',
    actionText: 'Check My Location Coverage →',
    relatedQuestions: [
      'How to book a new service?',
      'Is on-site inspection really ₹0?',
      'What services do you offer?',
    ],
  },

  // ── 8. HUMAN AGENT ESCALATION ──
  {
    id: 'human_handover',
    category: 'HUMAN_ESCALATION',
    title: 'Connect with a Human Operations Executive',
    patterns: [
      /talk\s+to\s+(a\s+)?(human|agent|person|executive|operator)/i,
      /speak\s+(with|to)\s+(human|agent)/i,
      /customer\s+care(\s+number)?/i,
      /call\s+me/i,
      /phone\s+support/i,
      /asli\s+insan\s+se\s+baat/i,
      /agent\s+please/i,
      /urgent\s+help/i,
    ],
    answer:
      '🎧 **Connected to Senior Operations Desk:**\nYour ticket has been marked **HIGH PRIORITY** on the Admin Operations Console. A dedicated support specialist is reviewing your account history and will reply directly in this chat.\n\n📞 **Emergency Direct Line:** +91 (800) 938-6820 (Available 24/7)',
    isEscalation: true,
    relatedQuestions: [
      'Track my technician',
      'Cancellation & Refund terms',
      'Check wallet balance',
    ],
  },
];

export const TOP_QUICK_REPLIES = [
  '📍 Track my technician',
  '✨ Is diagnosis really ₹0?',
  '🏆 What is covered in AMC?',
  '💳 Check my wallet balance',
  '📅 Reschedule my appointment',
  '🛑 Cancellation & refund terms',
  '🎧 Speak with Live Executive',
];
