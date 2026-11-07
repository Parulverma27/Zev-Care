import User from './User.js';
import Provider from './Provider.js';
import Booking from './Booking.js';
import WalletTransaction from './WalletTransaction.js';
import SubscriptionPlan from './SubscriptionPlan.js';
import SubAdmin from './SubAdmin.js';
import { Category, SubCategory, Service } from './Service.js';
import { Dispute, Banner, Notification, Chat } from './Dispute.js';

// Associations
User.hasMany(Booking, { foreignKey: 'user_id' });
Booking.belongsTo(User, { foreignKey: 'user_id' });

Provider.hasMany(Booking, { foreignKey: 'provider_id' });
Booking.belongsTo(Provider, { foreignKey: 'provider_id' });

User.hasMany(WalletTransaction, { foreignKey: 'user_id' });
WalletTransaction.belongsTo(User, { foreignKey: 'user_id' });

Category.hasMany(SubCategory, { foreignKey: 'category_id' });
SubCategory.belongsTo(Category, { foreignKey: 'category_id' });

Category.hasMany(Service, { foreignKey: 'category_id' });
Service.belongsTo(Category, { foreignKey: 'category_id' });

SubCategory.hasMany(Service, { foreignKey: 'sub_category_id' });
Service.belongsTo(SubCategory, { foreignKey: 'sub_category_id' });

export {
  User,
  Provider,
  Booking,
  WalletTransaction,
  SubscriptionPlan,
  SubAdmin,
  Category,
  SubCategory,
  Service,
  Dispute,
  Banner,
  Notification,
  Chat,
};
