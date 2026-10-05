/**
 * Firebase Admin / server-side config (notifications, token verify).
 */
export const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  databaseURL: process.env.FIREBASE_DATABASE_URL || '',
};

export const isFirebaseConfigured = () =>
  Boolean(firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey);

export default firebaseConfig;
