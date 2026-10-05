import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, TextInput } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import ImageUploadField from '../../admin/components/ImageUploadField';
import ProviderIcon from '../ProviderIcons';

export default function ProviderProfileScreen() {
  const { activeProvider, setActiveProvider, logoutProvider } = useApp();
  const navigate = useNavigate();

  const [isOnline, setIsOnline] = useState(activeProvider?.is_online ?? true);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Edit Form State
  const [name, setName] = useState(activeProvider?.name || '');
  const [phone, setPhone] = useState(activeProvider?.phone || '');
  const [email, setEmail] = useState(activeProvider?.email || '');
  const [trade, setTrade] = useState(activeProvider?.trade || '');
  const [experience, setExperience] = useState(activeProvider?.experience || '');
  const [location, setLocation] = useState(activeProvider?.location || '');
  const [profileImage, setProfileImage] = useState(activeProvider?.image_url || '');

  const handleToggleOnline = (val) => {
    setIsOnline(val);
    if (setActiveProvider && activeProvider) {
      setActiveProvider((prev) => ({ ...prev, is_online: val }));
    }
  };

  const handleSaveProfile = () => {
    if (setActiveProvider) {
      setActiveProvider((prev) => ({
        ...prev,
        name,
        phone,
        email,
        trade,
        experience,
        location,
        image_url: profileImage,
      }));
    }
    setEditModalVisible(false);
  };

  const handleLogout = () => {
    if (logoutProvider) logoutProvider();
    navigate('/provider/login');
  };

  const getInitials = (n = '') => {
    return n.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase() || 'RP';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Page Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Partner Profile Console</Text>
        <Text style={styles.subtitle}>Manage your technician identity, service trade, availability & account credentials.</Text>
      </View>

      {/* Main Identity Card */}
      <View style={styles.profileCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(activeProvider?.name || name)}</Text>
          </View>

          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.provName}>{activeProvider?.name || name}</Text>
              <View style={styles.verifiedBadge}>
                <ProviderIcon name="shield" color="#1d4ed8" size={10} />
                <Text style={styles.verifiedBadgeText}>VERIFIED PARTNER</Text>
              </View>
            </View>
            <Text style={styles.provTrade}>{activeProvider?.trade || trade}</Text>
            <View style={styles.locationRow}>
              <ProviderIcon name="pin" color="#64748b" size={12} />
              <Text style={styles.provMeta}>{activeProvider?.location || location} • {activeProvider?.experience || experience} Exp</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editIconBtn} onPress={() => setEditModalVisible(true)} activeOpacity={0.8}>
            <ProviderIcon name="edit" color="#2563eb" size={13} />
            <Text style={styles.editIconText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Availability Status Bar */}
        <View style={styles.statusRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>Duty Dispatch Availability</Text>
            <Text style={styles.statusSub}>
              {isOnline ? 'Active — Receiving new work order dispatches' : 'Offline — Dispatches paused'}
            </Text>
          </View>
          <View style={styles.toggleBox}>
            <Text style={[styles.toggleLabel, { color: isOnline ? '#2563eb' : '#64748b' }]}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: '#cbd5e1', true: '#2563eb' }}
            />
          </View>
        </View>
      </View>

      {/* Quick Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricBox}>
          <View style={styles.ratingBoxRow}>
            <ProviderIcon name="star" color="#f59e0b" size={15} />
            <Text style={styles.metricVal}>{activeProvider?.rating ?? '—'}</Text>
          </View>
          <Text style={styles.metricLabel}>Partner Rating</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricVal}>{activeProvider?.total_jobs ?? 0}</Text>
          <Text style={styles.metricLabel}>Jobs Completed</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricVal}>100%</Text>
          <Text style={styles.metricLabel}>Fulfillment Rate</Text>
        </View>
      </View>

      {/* Account Details List */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardSectionTitle}>Account & Contact Info</Text>

        <View style={styles.infoItemRow}>
          <View style={styles.infoLabelGroup}>
            <ProviderIcon name="phone" color="#64748b" size={13} />
            <Text style={styles.infoItemLabel}>Phone Number</Text>
          </View>
          <Text style={styles.infoItemValue}>{activeProvider?.phone || phone}</Text>
        </View>

        <View style={styles.infoItemRow}>
          <View style={styles.infoLabelGroup}>
            <ProviderIcon name="mail" color="#64748b" size={13} />
            <Text style={styles.infoItemLabel}>Email Address</Text>
          </View>
          <Text style={[styles.infoItemValue, styles.emailValue]}>{activeProvider?.email || email}</Text>
        </View>

        <View style={styles.infoItemRow}>
          <View style={styles.infoLabelGroup}>
            <ProviderIcon name="wrench" color="#64748b" size={13} />
            <Text style={styles.infoItemLabel}>Trade Specialization</Text>
          </View>
          <Text style={styles.infoItemValue}>{activeProvider?.trade || trade}</Text>
        </View>

        <View style={styles.infoItemRow}>
          <View style={styles.infoLabelGroup}>
            <ProviderIcon name="pin" color="#64748b" size={13} />
            <Text style={styles.infoItemLabel}>Service City / Base</Text>
          </View>
          <Text style={styles.infoItemValue}>{activeProvider?.location || location}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionBtnOutline} onPress={() => setEditModalVisible(true)} activeOpacity={0.8}>
          <ProviderIcon name="edit" color="#2563eb" size={15} />
          <Text style={styles.actionBtnOutlineText}>Edit Profile Information</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <ProviderIcon name="logout" color="#dc2626" size={15} />
          <Text style={styles.logoutBtnText}>Logout of Partner Account</Text>
        </TouchableOpacity>
      </View>

      {/* EDIT PROFILE MODAL */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Partner Profile</Text>
            <Text style={styles.modalSub}>Update your personal, trade, and contact information.</Text>

            <ScrollView style={{ width: '100%', maxHeight: 420 }} contentContainerStyle={{ gap: 10, paddingRight: 4, paddingBottom: 6 }} showsVerticalScrollIndicator={true}>
              <View>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput style={styles.textInput} value={name} onChangeText={setName} />
              </View>

              <View>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput style={styles.textInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </View>

              <View>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput style={styles.textInput} value={email} onChangeText={setEmail} keyboardType="email-address" />
              </View>

              <View>
                <Text style={styles.inputLabel}>Trade / Skill Specialization *</Text>
                <TextInput style={styles.textInput} value={trade} onChangeText={setTrade} />
              </View>

              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Experience</Text>
                  <TextInput style={styles.textInput} value={experience} onChangeText={setExperience} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Service Base City</Text>
                  <TextInput style={styles.textInput} value={location} onChangeText={setLocation} />
                </View>
              </View>

              <ImageUploadField
                label="Profile Picture / Avatar Image"
                value={profileImage}
                onChange={setProfileImage}
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Save Profile Changes</Text>
                <ProviderIcon name="arrowRight" color="#ffffff" size={14} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.closeModalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eff6ff', width: '100%' },
  content: { padding: 16, gap: 14, width: '100%', boxSizing: 'border-box' },
  header: { gap: 4, width: '100%' },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a', lineHeight: 24 },
  subtitle: { fontSize: 11.5, color: '#64748b', lineHeight: 15 },

  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 14,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  provName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  verifiedBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  provTrade: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  provMeta: {
    fontSize: 11,
    color: '#64748b',
  },
  editIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    cursor: 'pointer',
  },
  editIconText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  toggleBox: {
    alignItems: 'flex-end',
    gap: 2,
  },
  toggleLabel: {
    fontSize: 9.5,
    fontWeight: '800',
  },

  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  ratingBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  metricLabel: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
  },

  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  cardSectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  infoItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  infoLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  infoItemLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  infoItemValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a',
    wordBreak: 'break-all',
  },
  emailValue: {
    fontSize: 10.5,
    wordBreak: 'break-all',
  },

  actionsSection: {
    gap: 10,
    marginTop: 4,
  },
  actionBtnOutline: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    cursor: 'pointer',
  },
  actionBtnOutlineText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '800',
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 12,
    borderRadius: 12,
    cursor: 'pointer',
  },
  logoutBtnText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: '100%',
    boxSizing: 'border-box',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '92%',
    maxWidth: 400,
    maxHeight: '90%',
    gap: 8,
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    color: '#0f172a',
    width: '100%',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
    cursor: 'pointer',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  closeModalBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
});
