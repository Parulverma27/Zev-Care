import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getPlanTheme } from '../../config/planTheme';
import { AppIcon } from '../../components/AppIcons';

export default function UserProfileScreen({ onNavigate }) {
  const { activeUser, logoutUser, updateProfile, users } = useApp();
  const navigate = useNavigate();

  const isAnonymous = Boolean(
    !activeUser ||
    activeUser.isAnonymous ||
    (activeUser.isGuest && !activeUser.phone) ||
    (!activeUser.phone && !activeUser.guestId)
  );

  const isGuest = Boolean(
    activeUser?.isGuest ||
    activeUser?.id === 0 ||
    activeUser?.name === 'Guest User' ||
    isAnonymous
  );

  const guestIdDisplay = useMemo(() => {
    if (isAnonymous) return '';
    if (activeUser?.guestId && activeUser.guestId !== 'GUEST') return activeUser.guestId;
    try {
      const stored = sessionStorage.getItem('zevota_guest_session_id');
      if (stored) return stored;
      const counter = Number(localStorage.getItem('zevota_guest_counter') || 1);
      const newId = `GUEST-${String(counter).padStart(3, '0')}`;
      sessionStorage.setItem('zevota_guest_session_id', newId);
      return newId;
    } catch (e) {
      return 'GUEST-001';
    }
  }, [activeUser?.guestId, isAnonymous]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleOpenEditModal = () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    setEditName(activeUser?.name || '');
    setEditEmail(activeUser?.email || '');
    const cleanDigits = (activeUser?.phone || '').replace(/\D/g, '').slice(-10);
    setEditPhone(cleanDigits);
    setErrorMsg('');
    setSuccessMsg('');
    setEditModalVisible(true);
  };

  const handleSavePersonalDetails = () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();
    const cleanDigits = editPhone.replace(/\D/g, '').trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Please enter a valid full name (minimum 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!cleanDigits || cleanDigits.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    const isDuplicate = (users || []).some(
      (u) => u.id !== activeUser?.id && String(u.phone).replace(/\D/g, '').slice(-10) === cleanDigits
    );
    if (isDuplicate) {
      setErrorMsg('This mobile number is already registered to another account.');
      return;
    }

    setErrorMsg('');
    const updatedUser = {
      ...activeUser,
      name: trimmedName,
      email: trimmedEmail,
      phone: `+91 ${cleanDigits}`,
    };

    updateProfile(updatedUser);
    setSuccessMsg('Personal details updated successfully!');
    setTimeout(() => {
      setSuccessMsg('');
      setEditModalVisible(false);
    }, 1000);
  };

  const handleNav = (path) => {
    if (navigate) navigate(path);
    else if (onNavigate) onNavigate(path);
  };

  const handleGoBack = () => {
    if (window?.history?.state && window.history.state.idx > 0) {
      if (navigate) navigate(-1);
      else if (onNavigate) onNavigate(-1);
    } else {
      handleNav('/user/home');
    }
  };

  const userPlanTheme = getPlanTheme(activeUser?.subscription_plan);
  const hasPlan = Boolean(activeUser?.subscription_plan && activeUser?.subscription_plan.toLowerCase() !== 'free');

  const userInitials = useMemo(() => {
    if (isAnonymous) return '';
    if (isGuest) return 'GU';
    const name = activeUser?.name?.trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }, [activeUser?.name, isAnonymous, isGuest]);

  const MENU_ITEMS = [
    {
      label: 'My AMC',
      sub: isGuest
        ? 'No active contract'
        : hasPlan
        ? `Contract Active • ${activeUser.subscription_plan} Tier`
        : 'Explore 365-day AMC Plans',
      path: '/user/my-amc',
      bgColor: '#fffbeb',
      borderColor: '#fef3c7',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
    {
      label: 'AMC Protection Plans',
      sub: isGuest ? 'Explore AMC Plans' : (hasPlan ? `Active: ${activeUser.subscription_plan}` : 'No Active Plan'),
      path: '/user/plans',
      bgColor: '#eff6ff',
      borderColor: '#dbeafe',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="6 2 18 2 22 8 12 22 2 8 6 2" />
        </svg>
      ),
    },
    {
      label: 'Saved Addresses',
      sub: isGuest ? 'No address saved (Guest Mode)' : (() => {
        const addrs = activeUser?.saved_addresses || [];
        const def = addrs.find(a => a.isDefault) || addrs[0];
        return def?.address || activeUser?.address || 'No address saved';
      })(),
      path: '/user/saved-addresses',
      bgColor: '#ecfdf5',
      borderColor: '#d1fae5',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      label: 'Live Support Console',
      sub: 'Direct 24/7 Priority Chat with Operations',
      path: '/user/support',
      bgColor: '#f5f3ff',
      borderColor: '#ede9fe',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header Row with Back Arrow */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack} activeOpacity={0.7}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F1F3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeaderTopRow}>
          {/* Avatar Monogram or Guest Silhouette */}
          {isAnonymous ? (
            <View style={styles.avatarCircleGuest}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </View>
          ) : (
            <View style={[
              styles.avatarCircle,
              { borderColor: hasPlan ? userPlanTheme.badgeBorder : '#bfdbfe' }
            ]}>
              <Text style={styles.avatarInitials}>{userInitials}</Text>
              {hasPlan && (
                <View style={[styles.avatarVerifiedBadge, { backgroundColor: userPlanTheme.badgeBorder }]}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </View>
              )}
            </View>
          )}

          <View style={styles.profileMainInfo}>
            <View style={styles.nameAndActionRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>
                  {isAnonymous ? 'Welcome' : isGuest ? 'Guest User' : (activeUser?.name || '—')}
                </Text>
                <Text style={styles.userSub}>
                  {isAnonymous
                    ? 'Browsing mode • Not logged in'
                    : Boolean(activeUser?.phone || activeUser?.email)
                    ? [activeUser?.phone, activeUser?.email].filter(Boolean).join(' • ')
                    : 'Zevota Care Member'}
                </Text>
              </View>

              {!isAnonymous && (
                isGuest ? (
                  <View style={styles.guestIdChip}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                    <Text style={styles.guestIdChipText}>{guestIdDisplay}</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.editProfileChip} onPress={handleOpenEditModal} activeOpacity={0.8}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <Text style={styles.editProfileChipText}>Edit</Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {!isAnonymous && (
              isGuest ? (
                <View style={styles.guestModeBadge}>
                  <AppIcon name="lock" size={11} color="#1d4ed8" strokeWidth={2.2} />
                  <Text style={styles.guestModeBadgeText}>Guest Access</Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.planBadge,
                    {
                      backgroundColor: userPlanTheme.badgeBg,
                      borderColor: userPlanTheme.badgeBorder,
                    },
                  ]}
                >
                  {userPlanTheme.icon}
                  <Text
                    style={[
                      styles.planBadgeText,
                      { color: userPlanTheme.badgeTextColor },
                    ]}
                  >
                    {hasPlan ? `${activeUser.subscription_plan} Member` : 'Free Tier'}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>

        {/* If Anonymous: Dedicated full-width Royal Blue action button */}
        {isAnonymous && (
          <TouchableOpacity
            style={styles.guestSignInFullBtn}
            onPress={() => handleNav('/user/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.guestSignInFullBtnText}>Sign In / Register Account</Text>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </TouchableOpacity>
        )}
      </View>

      {/* Guest / Anonymous Mode Callout Banner */}
      {isAnonymous ? (
        <View style={styles.guestCalloutBanner}>
          <View style={styles.guestCalloutIconWrap}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text style={styles.guestCalloutTitle}>Register First</Text>
            <Text style={styles.guestCalloutBody}>
              Create your account to protect your appliances, track live service bookings, and recharge your Care Wallet.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.guestCalloutBtn}
            onPress={() => handleNav('/user/register')}
            activeOpacity={0.85}
          >
            <Text style={styles.guestCalloutBtnText}>Register</Text>
          </TouchableOpacity>
        </View>
      ) : isGuest ? (
        <View style={styles.guestCalloutBanner}>
          <View style={styles.guestCalloutIconWrap}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text style={styles.guestCalloutTitle}>Unlock All Care Features</Text>
            <Text style={styles.guestCalloutBody}>
              Register or sign in to protect your appliances, track live service bookings, and recharge your Care Wallet.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.guestCalloutBtn}
            onPress={() => handleNav('/user/register')}
            activeOpacity={0.85}
          >
            <Text style={styles.guestCalloutBtnText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Menu Links */}
      <View style={styles.menuCard}>
        {MENU_ITEMS.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.menuRow, idx === MENU_ITEMS.length - 1 && styles.menuRowLast]}
            onPress={() => {
              if (isGuest && (item.path === '/user/support' || item.path === '/user/saved-addresses' || item.path === '/user/property-verification')) {
                setShowGuestModal(true);
                return;
              }
              handleNav(item.path);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.bgColor, borderColor: item.borderColor }]}>
              {item.icon}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSub} numberOfLines={1}>{item.sub}</Text>
            </View>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </TouchableOpacity>
        ))}
      </View>

      {isAnonymous ? (
        <TouchableOpacity
          style={styles.loginActionBtn}
          onPress={() => handleNav('/user/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.loginActionBtnText}>Log In / Register</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            logoutUser();
            handleNav('/user/login');
          }}
          activeOpacity={0.8}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <Text style={styles.logoutBtnText}>Log Out Account</Text>
        </TouchableOpacity>
      )}

      {/* EDIT PERSONAL DETAILS MODAL */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Edit Personal Details</Text>
                <Text style={styles.modalSub}>Update registration information associated with your account.</Text>
              </View>
              <TouchableOpacity style={styles.closeIconBtn} onPress={() => setEditModalVisible(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </TouchableOpacity>
            </View>

            {errorMsg ? (
              <View style={styles.errorAlert}>
                <Text style={styles.errorAlertText}>⚠️ {errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={styles.successAlert}>
                <Text style={styles.successAlertText}>✅ {successMsg}</Text>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={(val) => { setEditName(val); setErrorMsg(''); }}
                placeholder="Enter full name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={(val) => { setEditEmail(val); setErrorMsg(''); }}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mobile Number *</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={editPhone}
                  onChangeText={(val) => { setEditPhone(val.replace(/\D/g, '').slice(0, 10)); setErrorMsg(''); }}
                  placeholder="10-digit mobile number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Default Address</Text>
              {(() => {
                const addrs = activeUser?.saved_addresses || [];
                const def = addrs.find(a => a.isDefault) || addrs[0];
                const addrText = def?.address || activeUser?.address || '';
                return addrText ? (
                  <TouchableOpacity
                    style={styles.addressReadonlyRow}
                    onPress={() => { setEditModalVisible(false); handleNav('/user/saved-addresses'); }}
                    activeOpacity={0.8}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <Text style={styles.addressReadonlyText} numberOfLines={2}>{addrText}</Text>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.addressReadonlyRow}
                    onPress={() => { setEditModalVisible(false); handleNav('/user/saved-addresses'); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.addressReadonlyText, { color: '#94a3b8' }]}>No address saved — tap to add</Text>
                  </TouchableOpacity>
                );
              })()}
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSavePersonalDetails} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Registration Required Modal for Guests */}
      <Modal
        visible={showGuestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGuestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', padding: 24, gap: 14, position: 'relative' }]}>
            <TouchableOpacity
              style={styles.guestCloseBtn}
              onPress={() => setShowGuestModal(false)}
              accessibilityLabel="Close modal"
            >
              <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>

            <View style={styles.guestIconCircle}>
              <AppIcon name="lock" size={26} color="#B45309" strokeWidth={2.2} />
            </View>

            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>
              {isAnonymous ? 'Register First' : 'Complete Your Profile First'}
            </Text>
            <Text style={[styles.modalSub, { textAlign: 'center', lineHeight: 20 }]}>
              {isAnonymous
                ? 'Please register your account first to manage personal details, save addresses, and book services.'
                : 'Please complete your profile to manage your personal details, saved addresses, and active services.'}
            </Text>

            <TouchableOpacity
              style={styles.guestPrimaryBtn}
              onPress={() => {
                setShowGuestModal(false);
                handleNav('/user/register');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.guestPrimaryBtnText}>
                {isAnonymous ? 'Register First →' : 'Complete Your Profile →'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestOutlineBtn}
              onPress={() => {
                setShowGuestModal(false);
                handleNav('/user/login');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.guestOutlineBtnText}>Already have an account? Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 16, maxWidth: 540, alignSelf: 'center', width: '100%' },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.06)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.2,
  },

  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.2,
    borderColor: '#bfdbfe',
    boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.08)',
  },
  profileHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#bfdbfe',
    position: 'relative',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
    flexShrink: 0,
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileMainInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameAndActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  avatarCircleGuest: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)',
  },
  guestSignInFullBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)',
  },
  guestSignInFullBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  userName: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: 0.2 },
  userSub: { fontSize: 12, color: '#2563eb', marginTop: 2, fontWeight: '600' },
  planBadge: {
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
    alignSelf: 'flex-start',
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  planBadgeText: { fontWeight: '800', fontSize: 11, letterSpacing: 0.3 },
  guestModeBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guestModeBadgeText: { color: '#1d4ed8', fontWeight: '700', fontSize: 10.5 },
  guestCalloutBanner: {
    backgroundColor: '#f8faff',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: '#dbeafe',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 4px 16px -4px rgba(37, 99, 235, 0.08)',
  },
  guestCalloutIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  guestCalloutTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  guestCalloutBody: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    marginTop: 2,
  },
  guestCalloutBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
  },
  guestCalloutBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },

  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    boxShadow: '0 8px 24px -6px rgba(15, 23, 42, 0.06)',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuRowLast: { borderBottomWidth: 0 },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { fontSize: 14.5, fontWeight: '700', color: '#0f172a' },
  menuSub: { fontSize: 11.5, color: '#64748b', marginTop: 3, fontWeight: '500' },

  logoutBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.06)',
  },
  logoutBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 13.5, letterSpacing: 0.2 },

  loginActionBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)',
  },
  loginActionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },

  editProfileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    boxShadow: '0 1px 3px rgba(37, 99, 235, 0.08)',
  },
  editProfileChipText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },

  registerFirstChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0052e0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    boxShadow: '0 2px 6px rgba(0, 82, 224, 0.25)',
  },
  registerFirstChipText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },

  guestIdChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  guestIdChipText: {
    color: '#0052e0',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 22,
    gap: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.2,
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  closeIconBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorAlert: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 10,
  },
  errorAlertText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  successAlert: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 10,
  },
  successAlertText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },

  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0f172a',
  },

  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 11,
    overflow: 'hidden',
  },
  countryCodeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0f172a',
  },

  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 13,
    borderRadius: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13.5,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingVertical: 13,
    borderRadius: 11,
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13.5,
  },

  addressReadonlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1.2,
    borderColor: '#fde68a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    cursor: 'pointer',
  },
  addressReadonlyText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    fontWeight: '500',
    lineHeight: 18,
  },
  guestCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  guestIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestPrimaryBtn: {
    backgroundColor: '#0052E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  guestPrimaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13.5,
    fontFamily: 'Inter, sans-serif',
  },
  guestOutlineBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestOutlineBtnText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 13,
    fontFamily: 'Inter, sans-serif',
  },
});
