import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useApp } from '../../context/AppContext';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import { getPlanTheme } from '../../config/planTheme';

export function AdminSubscriptionPlansScreen() {
  const { subscriptionPlans, setSubscriptionPlans } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  
  // Delete confirm state
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [walletCredit, setWalletCredit] = useState('');
  const [validityMonths, setValidityMonths] = useState('');
  const [applicableServices, setApplicableServices] = useState('');
  const [serviceLimits, setServiceLimits] = useState('');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [isRecommended, setIsRecommended] = useState(false);

  const openModal = (plan = null) => {
    if (plan) {
      setEditId(plan.id);
      setName(plan.name || '');
      setPrice(String(plan.price || ''));
      setWalletCredit(String(plan.wallet_credit || ''));
      setValidityMonths(String(plan.validity_months || ''));
      setApplicableServices(plan.applicable_services || '');
      setServiceLimits(plan.service_limits || '');
      setDescription(plan.description || '');
      
      let fArr = [];
      try { fArr = JSON.parse(plan.features_json || '[]'); } catch (e) {}
      setFeaturesText(fArr.join('\n'));
      setIsRecommended(plan.is_recommended || false);
    } else {
      setEditId(null);
      setName('');
      setPrice('');
      setWalletCredit('');
      setValidityMonths('12');
      setApplicableServices('');
      setServiceLimits('Unlimited Visits');
      setDescription('');
      setFeaturesText('');
      setIsRecommended(false);
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim() || !price.trim()) return;

    const featuresArray = featuresText.split('\n').map(f => f.trim()).filter(f => f.length > 0);

    const planData = {
      name,
      price: Number(price),
      wallet_credit: Number(walletCredit),
      validity_months: Number(validityMonths),
      applicable_services: applicableServices,
      service_limits: serviceLimits,
      description,
      features_json: JSON.stringify(featuresArray),
      is_recommended: isRecommended
    };

    if (editId) {
      setSubscriptionPlans(prev => prev.map(p => p.id === editId ? { ...p, ...planData } : p));
    } else {
      setSubscriptionPlans(prev => [...prev, { id: Date.now(), ...planData }]);
    }
    setModalVisible(false);
  };

  const promptDeletePlan = (plan) => {
    setDeleteTargetId(plan.id);
    setDeleteTargetName(plan.name);
    setDeleteConfirmVisible(true);
  };

  const confirmDeletePlan = () => {
    if (deleteTargetId) {
      setSubscriptionPlans(prev => prev.filter(p => p.id !== deleteTargetId));
    }
    setDeleteConfirmVisible(false);
    setDeleteTargetId(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.header}>
          <Text style={styles.title}>AMC Contract Plans Manager</Text>
          <Text style={styles.subtitle}>Configure 365-day AMC contract tiers, free scheduled visits, labor coverage, and parts protection caps.</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <Text style={styles.addBtnText}>Add AMC Plan</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.plansGrid}>
        {subscriptionPlans.map((plan, idx) => {
          let features = [];
          try { features = JSON.parse(plan.features_json || '[]'); } catch (e) {}
          const theme = getPlanTheme(plan.name);

          return (
            <View key={idx} style={[styles.planCard, { borderColor: theme.borderColor, borderWidth: 1.5 }]}>
              {plan.is_recommended && (
                <View style={[styles.recBadge, { backgroundColor: theme.buttonBg }]}>
                  <Text style={styles.recBadgeText}>★ RECOMMENDED • VIP CLUB</Text>
                </View>
              )}
              <View style={[styles.planHeader, { backgroundColor: theme.headerBgSolid, borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 12, margin: -12, marginBottom: 8 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.planName, { color: theme.headerTextColor }]}>{theme.icon} {plan.name}</Text>
                  <View style={{ backgroundColor: theme.badgeBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: theme.badgeBorder }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: theme.badgeTextColor }}>{theme.tierBadge}</Text>
                  </View>
                </View>
                <Text style={[styles.planPrice, { color: theme.headerTextColor, marginTop: 4 }]}>₹{plan.price.toLocaleString()}</Text>
                <Text style={[styles.planValidity, { color: 'rgba(255,255,255,0.85)' }]}>{plan.validity_months || 12} Months AMC Protection</Text>
              </View>
              
              <Text style={styles.planDesc}>{plan.description}</Text>
              <View style={[styles.creditBox, { backgroundColor: theme.creditBoxBg, borderColor: theme.creditBoxBorder, borderWidth: 1 }]}>
                <Text style={[styles.creditText, { color: theme.creditTextColor }]}>
                  🛡️ {theme.preventiveVisits} Free Visits • Parts Cap: ₹{theme.partsCap.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.featureList}>
                {features.map((f, i) => (
                  <Text key={i} style={styles.featureItem}>• {f}</Text>
                ))}
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openModal(plan)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => promptDeletePlan(plan)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Plan' : 'Add New Plan'}</Text>
            
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 12 }}>
                <View>
                  <Text style={styles.inputLabel}>Plan Name</Text>
                  <TextInput style={styles.textInput} value={name} onChangeText={setName} placeholder="e.g. Gold" />
                </View>
                
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Price (₹)</Text>
                    <TextInput style={styles.textInput} value={price} onChangeText={setPrice} placeholder="500000" keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Wallet Credit (₹)</Text>
                    <TextInput style={styles.textInput} value={walletCredit} onChangeText={setWalletCredit} placeholder="500000" keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Validity (Months)</Text>
                    <TextInput style={styles.textInput} value={validityMonths} onChangeText={setValidityMonths} placeholder="12" keyboardType="numeric" />
                  </View>
                </View>

                <View>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput style={styles.textInput} value={description} onChangeText={setDescription} placeholder="Brief description" />
                </View>

                <View>
                  <Text style={styles.inputLabel}>Features (One per line)</Text>
                  <TextInput 
                    style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]} 
                    value={featuresText} 
                    onChangeText={setFeaturesText} 
                    multiline 
                    placeholder="Feature 1&#10;Feature 2" 
                  />
                </View>

                <View>
                  <Text style={styles.inputLabel}>Applicable Services</Text>
                  <TextInput style={styles.textInput} value={applicableServices} onChangeText={setApplicableServices} placeholder="All Services" />
                </View>

                <View>
                  <Text style={styles.inputLabel}>Service Limits</Text>
                  <TextInput style={styles.textInput} value={serviceLimits} onChangeText={setServiceLimits} placeholder="Unlimited" />
                </View>

                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} 
                  onPress={() => setIsRecommended(!isRecommended)}
                >
                  <View style={[styles.checkbox, isRecommended && styles.checkboxActive]}>
                    {isRecommended && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
                  </View>
                  <Text style={{ fontSize: 13, color: '#334155' }}>Mark as Recommended Plan</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                <Text style={styles.submitBtnText}>{editId ? 'Save Changes' : 'Add Plan'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ConfirmDeleteModal
        visible={deleteConfirmVisible}
        title="Delete Subscription Plan?"
        message={`Are you sure you want to delete the "${deleteTargetName}" plan? Users currently subscribed will keep their active balance.`}
        onConfirm={confirmDeletePlan}
        onCancel={() => setDeleteConfirmVisible(false)}
        confirmText="Delete Plan"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24, gap: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  header: { gap: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b' },
  addBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 12 },

  plansGrid: { gap: 16, flexDirection: 'row', flexWrap: 'wrap' },
  planCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', width: '31%', minWidth: 280, gap: 12, position: 'relative' },
  recommendedCard: { borderColor: '#3b82f6', borderWidth: 2 },
  recBadge: { position: 'absolute', top: -10, right: 16, backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  recBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  
  planHeader: { gap: 2 },
  planName: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  planPrice: { fontSize: 20, fontWeight: '700', color: '#3b82f6' },
  planValidity: { fontSize: 11, color: '#64748b' },
  
  planDesc: { fontSize: 12, color: '#475569', lineHeight: 16 },
  
  creditBox: { backgroundColor: '#ecfdf5', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#a7f3d0' },
  creditText: { color: '#059669', fontSize: 11, fontWeight: '700' },
  
  featureList: { gap: 4, flex: 1 },
  featureItem: { fontSize: 11, color: '#334155' },

  cardActions: { gap: 8, flexDirection: 'row', marginTop: 8 },
  editBtn: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  editBtnText: { color: '#0f172a', fontSize: 12, fontWeight: '600' },
  deleteBtn: { flex: 1, backgroundColor: '#fee2e2', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  deleteBtnText: { color: '#dc2626', fontSize: 12, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 500, gap: 16 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginBottom: 4 },
  textInput: { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 10, fontSize: 13, color: '#0f172a', outlineStyle: 'none' },
  
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },

  modalActionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  submitBtn: { flex: 1, backgroundColor: '#7c3aed', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontWeight: '600', fontSize: 12 },
});
