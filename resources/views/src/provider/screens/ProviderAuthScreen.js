import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useNavigate, useLocation } from 'react-router-dom';
import ZevotaLogo from '../../components/ZevotaLogo';
import ProviderIcon from '../ProviderIcons';

import { useApp } from '../../context/AppContext';

export default function ProviderAuthScreen({ onAuthComplete }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveProvider, setProviders, providers } = useApp();

  // Sync login/signup with URL: /provider/login vs /provider/register
  const [authMode, setAuthMode] = useState(
    location.pathname.includes('/register') ? 'signup' : 'login'
  );

  // Steps: 'MOBILE' | 'OTP' | 'PROFILE'
  const [step, setStep] = useState('MOBILE');

  const [phone, setPhone] = useState('9988776655');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');

  // Provider Profile Form (Sign Up only)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [trade, setTrade] = useState('');
  const [experience, setExperience] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    setAuthMode(location.pathname.includes('/register') ? 'signup' : 'login');
    setStep('MOBILE');
    setError('');
    setOtp('');
  }, [location.pathname]);

  useEffect(() => {
    let interval = null;
    if (step === 'OTP' && timer > 0) {
      interval = setInterval(() => setTimer((p) => p - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const switchMode = (mode) => {
    navigate(mode === 'signup' ? '/provider/register' : '/provider/login');
    setError('');
    setOtp('');
    setTimer(60);
    setCanResend(false);
  };

  const handleSendOtp = () => {
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setStep('OTP');
    setTimer(60);
    setCanResend(false);
  };

  const handleVerifyOtp = () => {
    const code = otp?.trim() || '';
    if (code === '4829') {
      setError('');
      if (authMode === 'signup') {
        setStep('PROFILE');
      } else {
        const matched = (providers || []).find(
          (p) => String(p.phone).replace(/\D/g, '').slice(-10) === phone.replace(/\D/g, '').slice(-10)
        ) || {
          id: Date.now(),
          name: fullName || 'Provider',
          phone: `+91 ${phone}`,
          email: email || '',
          rating: 0,
          total_jobs: 0,
          earnings: 0.0,
          is_online: true,
          status: 'APPROVED',
          location: city || 'Bandra West, Mumbai',
        };
        if (setActiveProvider) setActiveProvider(matched);
        if (onAuthComplete) onAuthComplete(matched);
        navigate('/provider/dashboard');
      }
    } else {
      setError('Invalid OTP. Please enter the 4-digit code sent to your mobile.');
    }
  };

  const handleProfileSubmit = () => {
    if (!fullName || !trade) {
      setError('Please fill in required fields.');
      return;
    }
    setError('');
    const newProv = {
      id: Date.now(),
      name: fullName,
      phone: `+91 ${phone}`,
      email: email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@zevotacare.com`,
      trade,
      experience,
      location: city || 'Mumbai, Maharashtra',
      rating: 5.0,
      total_jobs: 0,
      earnings: 0.0,
      is_online: true,
      status: 'APPROVED',
    };
    if (setActiveProvider) setActiveProvider(newProv);
    if (typeof setProviders === 'function') {
      setProviders((prev) => {
        const exists = (prev || []).some(
          (p) => String(p.phone).replace(/\D/g, '').slice(-10) === phone.replace(/\D/g, '').slice(-10)
        );
        return exists ? prev : [newProv, ...(prev || [])];
      });
    }
    if (onAuthComplete) onAuthComplete(newProv);
    navigate('/provider/dashboard');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.authCard}>

        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <ZevotaLogo size="large" />
          <View style={styles.providerBadge}>
            <ProviderIcon name="wrench" color="#1d4ed8" size={12} />
            <Text style={styles.providerBadgeText}>SERVICE PROVIDER PORTAL</Text>
          </View>
        </View>

        {/* LOGIN / SIGN UP TOGGLE */}
        <View style={styles.toggleWrapper}>
          <TouchableOpacity
            style={[styles.toggleBtn, authMode === 'login' && styles.toggleBtnActive]}
            onPress={() => switchMode('login')}
            activeOpacity={0.85}
          >
            <Text style={[styles.toggleBtnText, authMode === 'login' && styles.toggleBtnTextActive]}>
              Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, authMode === 'signup' && styles.toggleBtnActive]}
            onPress={() => switchMode('signup')}
            activeOpacity={0.85}
          >
            <Text style={[styles.toggleBtnText, authMode === 'signup' && styles.toggleBtnTextActive]}>
              Register as Provider
            </Text>
          </TouchableOpacity>
        </View>

        {/* STEP 1: MOBILE NUMBER */}
        {step === 'MOBILE' && (
          <View style={styles.formBox}>
            <View style={styles.titleRow}>
              <Text style={styles.formTitle}>
                {authMode === 'login' ? 'Provider Login' : 'Join as a Provider'}
              </Text>
              <ProviderIcon name={authMode === 'login' ? 'shield' : 'send'} color="#2563eb" size={18} />
            </View>

            <Text style={styles.formSub}>
              {authMode === 'login'
                ? 'Enter your registered mobile number to access your work orders.'
                : 'Register to start receiving service assignments in your area.'}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.inputLabel}>Mobile Phone Number</Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                placeholder="9123456789"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp}>
              <Text style={styles.primaryBtnText}>Send Verification OTP</Text>
              <ProviderIcon name="arrowRight" color="#ffffff" size={14} />
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By continuing, you agree to Zevota Care Provider{' '}
              <Text style={styles.termsLink}>Terms & Conditions</Text>.
            </Text>
          </View>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'OTP' && (
          <View style={styles.formBox}>
            <View style={styles.titleRow}>
              <Text style={styles.formTitle}>Verify OTP</Text>
              <ProviderIcon name="key" color="#2563eb" size={18} />
            </View>

            <Text style={styles.formSub}>
              Code sent to <Text style={styles.boldText}>+91 {phone}</Text>.{'\n'}
              Demo OTP is <Text style={styles.boldText}>4829</Text>.
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={4}
              value={otp}
              onChangeText={setOtp}
              placeholder="4829"
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.timerRow}>
              <Text style={styles.timerText}>
                {timer > 0 ? `Resend in 00:${timer < 10 ? `0${timer}` : timer}` : "Didn't receive code?"}
              </Text>
              {canResend && (
                <TouchableOpacity onPress={() => { setTimer(60); setCanResend(false); }}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp}>
              <Text style={styles.primaryBtnText}>
                {authMode === 'login' ? 'Verify & Login' : 'Verify & Continue'}
              </Text>
              <ProviderIcon name="arrowRight" color="#ffffff" size={14} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.backLink} onPress={() => setStep('MOBILE')}>
              <ProviderIcon name="back" color="#64748b" size={14} />
              <Text style={styles.backLinkText}>Change Number</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: PROVIDER PROFILE SETUP (Sign Up Only) */}
        {step === 'PROFILE' && (
          <View style={styles.formBox}>
            <View style={styles.titleRow}>
              <Text style={styles.formTitle}>Provider Profile</Text>
              <ProviderIcon name="user" color="#2563eb" size={18} />
            </View>

            <Text style={styles.formSub}>Tell us about your skills & service area to get matched with the right jobs.</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.textInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Rajesh Sharma"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="rajesh@example.com"
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.rowTwo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Trade / Skill *</Text>
                <TextInput
                  style={styles.textInput}
                  value={trade}
                  onChangeText={setTrade}
                  placeholder="Electrician"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Experience</Text>
                <TextInput
                  style={styles.textInput}
                  value={experience}
                  onChangeText={setExperience}
                  placeholder="5 Years"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Service City / Area *</Text>
            <TextInput
              style={styles.textInput}
              value={city}
              onChangeText={setCity}
              placeholder="Mumbai, Maharashtra"
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleProfileSubmit}>
              <Text style={styles.primaryBtnText}>Save & Access Dashboard</Text>
              <ProviderIcon name="arrowRight" color="#ffffff" size={14} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eff6ff' },
  content: { paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center', justifyContent: 'center', minHeight: '100%', boxSizing: 'border-box' },

  authCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    maxWidth: 390,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
    gap: 18,
    boxSizing: 'border-box',
    overflow: 'hidden',
  },

  brandHeader: { alignItems: 'center', gap: 8 },
  providerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#dbeafe', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#93c5fd' },
  providerBadgeText: { fontSize: 10, fontWeight: '800', color: '#1d4ed8', letterSpacing: 0.5 },

  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    width: '100%',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  toggleBtnActive: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
  },
  toggleBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  formBox: { gap: 10, width: '100%' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  formTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  formSub: { fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 17 },

  errorText: { color: '#dc2626', fontSize: 11, fontWeight: '700', backgroundColor: '#fef2f2', padding: 8, borderRadius: 8, textAlign: 'center' },

  inputLabel: { fontSize: 11, fontWeight: '800', color: '#334155', marginTop: 2 },
  phoneInputRow: { flexDirection: 'row', gap: 8, width: '100%' },
  countryCode: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
  countryCodeText: { fontWeight: '800', color: '#0f172a', fontSize: 13 },
  phoneInput: { flex: 1, minWidth: 0, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#bfdbfe', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, fontWeight: '800', color: '#0f172a' },

  otpInput: { backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#2563eb', borderRadius: 12, padding: 14, fontSize: 26, fontWeight: '900', textAlign: 'center', color: '#0f172a', letterSpacing: 8 },

  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  resendText: { fontSize: 11, color: '#2563eb', fontWeight: '800' },

  textInput: { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 12, color: '#0f172a' },
  rowTwo: { flexDirection: 'row', gap: 8 },

  primaryBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13, letterSpacing: 0.2 },

  termsText: { fontSize: 10, color: '#94a3b8', textAlign: 'center', lineHeight: 14, marginTop: 2 },
  termsLink: { color: '#2563eb', fontWeight: '700' },

  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  backLinkText: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  boldText: { fontWeight: '900', color: '#1d4ed8' },
});
