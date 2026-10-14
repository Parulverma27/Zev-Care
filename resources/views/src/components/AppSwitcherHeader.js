import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import ZevotaLogo from './ZevotaLogo';
import { AppIcon } from './AppIcons';

export default function AppSwitcherHeader() {
  const { activeApp, setActiveApp, activeUser, activeProvider } = useApp();

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <ZevotaLogo size="small" />
      </View>

      <View style={styles.switcherContainer}>
        <TouchableOpacity
          style={[styles.switchButton, activeApp === 'USER' && styles.activeUserButton]}
          onPress={() => setActiveApp('USER')}
        >
          <AppIcon name="user" size={13} color={activeApp === 'USER' ? '#ffffff' : '#334155'} />
          <Text style={[styles.switchText, activeApp === 'USER' && styles.activeText]}>
            User App
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchButton, activeApp === 'PROVIDER' && styles.activeProviderButton]}
          onPress={() => setActiveApp('PROVIDER')}
        >
          <AppIcon name="wrench" size={13} color={activeApp === 'PROVIDER' ? '#ffffff' : '#334155'} />
          <Text style={[styles.switchText, activeApp === 'PROVIDER' && styles.activeText]}>
            Provider App
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchButton, activeApp === 'ADMIN' && styles.activeAdminButton]}
          onPress={() => setActiveApp('ADMIN')}
        >
          <AppIcon name="shield" size={13} color={activeApp === 'ADMIN' ? '#ffffff' : '#334155'} />
          <Text style={[styles.switchText, activeApp === 'ADMIN' && styles.activeText]}>
            Admin Panel
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileBadge}>
        {activeApp === 'USER' && (
          <Text style={styles.profileBadgeText}>
            User: <Text style={styles.bold}>{activeUser?.name || 'Guest'}</Text> | AMC:{' '}
            <Text style={activeUser?.subscription_plan ? styles.goldBold : styles.blueBold}>
              {activeUser?.subscription_plan ? `${activeUser.subscription_plan} Plan` : 'No Active Plan'}
            </Text>
          </Text>
        )}
        {activeApp === 'PROVIDER' && (
          <Text style={styles.profileBadgeText}>
            Partner: <Text style={styles.bold}>{activeProvider?.name || '—'}</Text>{activeProvider?.rating ? ` (${activeProvider.rating}★)` : ''}
          </Text>
        )}
        {activeApp === 'ADMIN' && (
          <Text style={styles.profileBadgeText}>
            Super Admin | Operations Control Center
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  brandRow: {
    marginRight: 8,
  },
  switcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
  },
  activeUserButton: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  activeProviderButton: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  activeAdminButton: {
    backgroundColor: '#7c3aed',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  switchText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  profileBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  profileBadgeText: {
    color: '#1e40af',
    fontSize: 11,
  },
  bold: {
    fontWeight: '700',
    color: '#0f172a',
  },
  blueBold: {
    fontWeight: '900',
    color: '#2563eb',
  },
  goldBold: {
    fontWeight: '800',
    color: '#b45309',
  },
});
