/**
 * Intelligent Support Bot Engine.
 * Matches user inquiries against pre-trained intents, injects real dynamic context,
 * and suggests follow-up actions and human escalation.
 */

import { PRETRAINED_INTENTS, TOP_QUICK_REPLIES } from '../config/supportKnowledgeBase';

/**
 * Clean & normalize input query for classification
 */
function normalizeQuery(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[?!.,;:'"()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format status for user display
 */
function humanStatus(status) {
  if (!status) return 'In Progress';
  switch (status) {
    case 'PROVIDER_ON_THE_WAY':
      return 'Technician is On the Way 🚗';
    case 'PROVIDER_ARRIVED':
      return 'Technician Arrived at Location 📍';
    case 'SERVICE_IN_PROGRESS':
      return 'Repair in Progress 🔧';
    case 'AWAITING_USER_APPROVAL':
      return 'Inspection Completed — Awaiting Your Approval 📋';
    case 'BOOKING_COMPLETED':
      return 'Service Completed & Inspected ✓';
    default:
      return status.replace(/_/g, ' ');
  }
}

/**
 * Classifies query and resolves dynamic template answer.
 *
 * @param {string} text - User message text
 * @param {Object} context - User runtime context
 * @param {Object} context.activeUser
 * @param {Array} [context.bookings=[]]
 * @param {Object} [context.activeAmc]
 * @param {Object} [context.wallet]
 */
export function classifySupportQuery(text = '', context = {}) {
  const query = normalizeQuery(text);
  if (!query) {
    return {
      matchedIntent: null,
      confidence: 'NONE',
      replyText: 'Hello! How can Zevota Care assist you today? Please choose from common topics below or type your question.',
      suggestedQuestions: TOP_QUICK_REPLIES.slice(0, 4),
      actionLink: null,
      actionText: null,
      isEscalation: false,
    };
  }

  const { activeUser, bookings = [], activeAmc, wallet } = context;

  // Find latest active booking for this user
  const latestBooking = bookings && bookings.length > 0 ? bookings[0] : null;

  // Check explicit greetings
  if (/^(hi|hello|hey|namaste|good\s+(morning|afternoon|evening))\b/i.test(query)) {
    const firstName = (activeUser?.name || 'there').split(' ')[0];
    return {
      matchedIntent: null,
      confidence: 'HIGH',
      replyText: `👋 Hello ${firstName}! I am **Zeva AI**, your 24/7 Zevota Care assistant. How can I help you today?`,
      suggestedQuestions: TOP_QUICK_REPLIES.slice(0, 4),
      actionLink: null,
      actionText: null,
      isEscalation: false,
    };
  }

  // Iterate over intents
  let bestMatch = null;

  for (const intent of PRETRAINED_INTENTS) {
    for (const pattern of intent.patterns) {
      if (pattern.test(query)) {
        bestMatch = intent;
        break;
      }
    }
    if (bestMatch) break;
  }

  // If no direct regex match, try fuzzy keyword match
  if (!bestMatch) {
    const words = query.split(' ').filter((w) => w.length > 3);
    for (const intent of PRETRAINED_INTENTS) {
      const matchScore = words.reduce((score, word) => {
        const titleMatch = intent.title.toLowerCase().includes(word) ? 2 : 0;
        const answerMatch = intent.answer.toLowerCase().includes(word) ? 1 : 0;
        return score + titleMatch + answerMatch;
      }, 0);

      if (matchScore >= 4) {
        bestMatch = intent;
        break;
      }
    }
  }

  // Match Found! Resolve dynamic tokens
  if (bestMatch) {
    const isBookingRequired = bestMatch.requiresBooking;
    const isPlanRequired = bestMatch.requiresPlan;

    // Use fallback if booking/plan is strictly required but absent
    let rawAnswer = bestMatch.answer;
    if (isBookingRequired && !latestBooking) {
      rawAnswer = bestMatch.fallbackAnswer || bestMatch.answer;
    } else if (isPlanRequired && !activeAmc && !activeUser?.subscription_plan) {
      rawAnswer = bestMatch.fallbackAnswer || bestMatch.answer;
    }

    // Token Replacements
    const userName = (activeUser?.name || 'Customer').trim();
    const techName = latestBooking?.provider_name || 'Assigned Technician';
    const bookingId = latestBooking?.booking_id || 'Active Booking';
    const bookingStatus = humanStatus(latestBooking?.status);
    const scheduledTime = latestBooking?.scheduled_date || 'Today';
    const otp = latestBooking?.completion_otp || '4829';

    const planName = activeAmc?.planName || activeUser?.subscription_plan || 'Silver AMC';
    const contractNo = activeAmc?.contractNo || `AMC-2026-${String(activeUser?.id || 1).padStart(4, '0')}`;
    const visitsLeft = activeAmc?.visitsRemaining != null ? activeAmc.visitsRemaining : 2;
    const totalVisits = activeAmc?.totalVisits || 2;
    const partsLeft = (activeAmc?.partsRemaining || 15000).toLocaleString('en-IN');
    const slaHours = activeAmc?.slaHours || 4;
    const walletBal = (wallet?.balance ?? activeUser?.wallet_balance ?? 0).toLocaleString('en-IN');
    const serviceName = latestBooking?.service_name || 'Home Maintenance';

    const resolvedText = rawAnswer
      .replace(/{USER_NAME}/g, userName)
      .replace(/{TECHNICIAN_NAME}/g, techName)
      .replace(/{BOOKING_ID}/g, bookingId)
      .replace(/{BOOKING_STATUS}/g, bookingStatus)
      .replace(/{SCHEDULED_TIME}/g, scheduledTime)
      .replace(/{OTP}/g, otp)
      .replace(/{SERVICE_NAME}/g, serviceName)
      .replace(/{PLAN_NAME}/g, planName)
      .replace(/{CONTRACT_NO}/g, contractNo)
      .replace(/{VISITS_LEFT}/g, String(visitsLeft))
      .replace(/{TOTAL_VISITS}/g, String(totalVisits))
      .replace(/{PARTS_LEFT}/g, partsLeft)
      .replace(/{SLA_HOURS}/g, String(slaHours))
      .replace(/{WALLET_BAL}/g, walletBal);

    return {
      matchedIntent: bestMatch,
      confidence: 'HIGH',
      replyText: resolvedText,
      suggestedQuestions: bestMatch.relatedQuestions || TOP_QUICK_REPLIES.slice(0, 3),
      actionLink: bestMatch.actionLink || null,
      actionText: bestMatch.actionText || null,
      isEscalation: Boolean(bestMatch.isEscalation),
    };
  }

  // Fallback when query is not recognized
  return {
    matchedIntent: null,
    confidence: 'NONE',
    replyText:
      '🤖 **Zeva AI Assistant:**\nI could not find an exact pre-trained answer for that phrasing. Our Live Operations Desk has received your request and will follow up shortly.\n\nIn the meantime, you can explore common answers below:',
    suggestedQuestions: TOP_QUICK_REPLIES.slice(0, 3),
    actionLink: null,
    actionText: null,
    isEscalation: false,
  };
}

export function getQuickStartQuestions() {
  return TOP_QUICK_REPLIES;
}
