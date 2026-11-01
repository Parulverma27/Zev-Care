import React from 'react';
import SubscriptionPlansScreen from './SubscriptionPlansScreen';

/**
 * MyAmcScreen is now unified with SubscriptionPlansScreen.
 * All route paths (/user/my-amc, /user/plans, /user/wallet) point to the unified AMC screen.
 */
export default function MyAmcScreen(props) {
  return <SubscriptionPlansScreen {...props} isMyAmcOnly={true} />;
}
