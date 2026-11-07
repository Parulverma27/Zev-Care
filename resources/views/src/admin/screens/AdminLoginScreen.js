import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import ZevotaLogo from '../../components/ZevotaLogo';

// Real Vector SVG Icons (No Emojis)
const MailIcon = ({ color = '#64748b', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = ({ color = '#64748b', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = ({ color = '#64748b', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = ({ color = '#64748b', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const ShieldCheckIcon = ({ color = '#1d4ed8', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const AlertTriangleIcon = ({ color = '#dc2626', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ArrowRightIcon = ({ color = '#ffffff', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const CrownIcon = ({ color = '#2563eb', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);

const ChartBarIcon = ({ color = '#2563eb', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const ScaleIcon = ({ color = '#2563eb', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h18" />
  </svg>
);

export default function AdminLoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminLogin, adminUser } = useApp() || {};

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (adminUser) {
      const dest = location.state?.from || '/admin/dashboard';
      navigate(dest, { replace: true });
    }
  }, [adminUser, location.state, navigate]);

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Please enter your password (min 4 characters).');
      return;
    }

    setIsLoading(true);

    try {
      if (typeof adminLogin === 'function') {
        const result = await adminLogin(email.trim(), password);
        if (result?.success) {
          navigate(location.state?.from && String(location.state.from).startsWith('/admin')
            ? location.state.from
            : '/admin/dashboard');
        } else {
          setErrorMsg(result?.message || 'Login failed. Check your credentials.');
        }
      } else {
        setErrorMsg('Login service unavailable. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Login failed. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillSuperAdmin = () => {
    setEmail('admin@zevotacare.com');
    setPassword('admin123');
    setErrorMsg('');
  };

  const fillSubAdmin = (name, emailAddr) => {
    setEmail(emailAddr);
    setPassword('subadmin123');
    setErrorMsg('');
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          {/* Header & Logo */}
          <View style={styles.headerBox}>
            <View style={styles.logoWrapper}>
              <ZevotaLogo size="medium" />
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.securityBadge}>
                <ShieldCheckIcon color="#1d4ed8" size={13} />
                <Text style={styles.securityBadgeText}>256-BIT SSL ENCRYPTED</Text>
              </View>
              <View style={styles.versionBadge}>
                <Text style={styles.versionBadgeText}>PORTAL v2.5</Text>
              </View>
            </View>
            <Text style={styles.titleText}>Admin Control Portal</Text>
            <Text style={styles.subTitleText}>
              Sign in as Super Admin or Category Sub-Admin to access your operational dashboard.
            </Text>
          </View>

          {/* Error Message Alert */}
          {!!errorMsg && (
            <View style={styles.errorAlert}>
              <AlertTriangleIcon color="#dc2626" size={18} />
              <Text style={styles.errorAlertText}>{errorMsg}</Text>
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.iconBox}>
                <MailIcon color="#64748b" size={18} />
              </View>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="admin@zevotacare.com"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.iconBox}>
                <LockIcon color="#64748b" size={18} />
              </View>
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? <EyeOffIcon color="#64748b" size={18} /> : <EyeIcon color="#64748b" size={18} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setRememberMe(!rememberMe)}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>{'✓'}</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Remember my session</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setErrorMsg('Contact DevOps IT at devops@zevotacare.com for password reset.')}>
              <Text style={styles.forgotLink}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Primary Login Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Authenticate & Launch Portal</Text>
                <ArrowRightIcon color="#ffffff" size={18} />
              </>
            )}
          </TouchableOpacity>

          {/* Quick Demo Fill Credentials */}
          <View style={styles.demoSection}>
            <Text style={styles.demoSectionTitle}>QUICK LOGIN CREDENTIALS</Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity style={styles.demoChip} onPress={fillSuperAdmin}>
                <CrownIcon color="#2563eb" size={14} />
                <Text style={styles.demoChipText}>Super Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.demoChip} onPress={() => fillSubAdmin('Anil', 'anil@zevotacare.com')}>
                <ChartBarIcon color="#2563eb" size={14} />
                <Text style={styles.demoChipText}>Electrical</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.demoChip} onPress={() => fillSubAdmin('Sunil', 'sunil@zevotacare.com')}>
                <ScaleIcon color="#2563eb" size={14} />
                <Text style={styles.demoChipText}>Plumbing</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Security Note */}
          <View style={styles.footerNote}>
            <Text style={styles.footerNoteText}>
              Zevota Cloud Core Services{' '}{'•'}{' '}All login attempts are authenticated against the server.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    width: '100%',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 36,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  securityBadgeText: {
    color: '#1d4ed8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  versionBadge: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  versionBadgeText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
  },
  titleText: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subTitleText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },

  roleContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  rolePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rolePill: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeRolePill: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  rolePillText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  activeRolePillText: {
    color: '#ffffff',
    fontWeight: '700',
  },

  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  errorAlertText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  formGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  iconBox: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 14,
    height: '100%',
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 6,
  },

  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  checkboxLabel: {
    color: '#475569',
    fontSize: 13,
  },
  forgotLink: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
  },

  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    height: 50,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  demoSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  demoSectionTitle: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
    textAlign: 'center',
  },
  demoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 6,
  },
  demoChipText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
  },

  footerNote: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 14,
    alignItems: 'center',
  },
  footerNoteText: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
  },
});
