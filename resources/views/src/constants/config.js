import { Platform } from 'react-native';

/**
 * API base URL for web and native.
 * - Web dev: proxied via Expo or use /api when served from Express
 * - Native dev: set EXPO_PUBLIC_API_URL to your machine IP (see README)
 */
function getApiBaseUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const port = window.location.port;
    const isExpoDev = ['8081', '19006', '19000'].includes(port);
    if (isExpoDev) {
      return 'http://127.0.0.1:3000/api';
    }
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost || !process.env.EXPO_PUBLIC_API_URL) {
      return `${window.location.origin}/api`;
    }
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  return 'http://127.0.0.1:3000/api';
}

export const API_BASE_URL = getApiBaseUrl();
