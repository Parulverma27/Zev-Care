import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import ApplianceBrandField from './ApplianceBrandField';
import { OTHER_BRAND } from '../../config/applianceBrands';

export default function DynamicApplianceFields({
  fields = [],
  values = {},
  errors = {},
  onChange,
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [customMode, setCustomMode] = useState({});

  const setField = (id, val) => {
    onChange?.({ ...values, [id]: val });
  };

  return (
    <View style={styles.form}>
      {fields
        .filter((f) => f.id !== 'condition' && (f.label || '').toLowerCase() !== 'condition')
        .map((field) => {
        if (field.type === 'brand') {
          return (
            <ApplianceBrandField
              key={field.id}
              value={values.brand || ''}
              customBrand={values.customBrand || ''}
              onChangeBrand={(b) => setField('brand', b)}
              onChangeCustomBrand={(t) => onChange?.({ ...values, customBrand: t, brand: OTHER_BRAND })}
              error={errors.brand || ''}
            />
          );
        }

        if (field.type === 'select') {
          const isOpen = openDropdown === field.id;
          const isCompulsory = isFieldCompulsory(field);
          const isCustom = !!customMode[field.id] || (Boolean(values[field.id]) && !(field.options || []).includes(values[field.id]));

          return (
            <View key={field.id} style={[styles.fieldGroup, { zIndex: isOpen ? 100 : 1 }]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  {field.label}
                  {isCompulsory ? <Text style={styles.requiredStar}> *</Text> : <Text style={styles.optionalHint}> (optional)</Text>}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (isCustom) {
                      setCustomMode((prev) => ({ ...prev, [field.id]: false }));
                      setField(field.id, '');
                    } else {
                      setCustomMode((prev) => ({ ...prev, [field.id]: true }));
                      setField(field.id, '');
                      setOpenDropdown(null);
                    }
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.customToggleLink}>
                    {isCustom ? 'Choose from list' : '+ Type custom'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isCustom ? (
                <View style={styles.customInputRow}>
                  <TextInput
                    style={[styles.input, styles.customInputField, errors[field.id] && styles.inputError]}
                    value={values[field.id] || ''}
                    onChangeText={(t) => setField(field.id, t)}
                    placeholder={`Enter custom ${field.label.toLowerCase()}...`}
                    placeholderTextColor="#94a3b8"
                    accessibilityLabel={field.label}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.chooseListBtn}
                    onPress={() => {
                      setCustomMode((prev) => ({ ...prev, [field.id]: false }));
                      setField(field.id, '');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chooseListBtnText}>Pick list</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.input, styles.dropdown, errors[field.id] && styles.inputError]}
                    onPress={() => setOpenDropdown(isOpen ? null : field.id)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={field.label}
                  >
                    <Text style={[styles.inputText, !values[field.id] && styles.placeholder]} numberOfLines={1}>
                      {values[field.id] || `Select ${field.label}`}
                    </Text>
                    <Text style={styles.chevron}>{isOpen ? '▴' : '▾'}</Text>
                  </TouchableOpacity>
                  {isOpen && (
                    <View style={styles.menu}>
                      <ScrollView
                        style={styles.menuScroll}
                        contentContainerStyle={styles.menuScrollContent}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                        keyboardShouldPersistTaps="handled"
                      >
                        {(field.options || []).map((opt) => {
                          const isSelected = values[field.id] === opt;
                          return (
                            <TouchableOpacity
                              key={opt}
                              style={[styles.option, isSelected && styles.optionSelected]}
                              onPress={() => {
                                setField(field.id, opt);
                                setOpenDropdown(null);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                {opt}
                              </Text>
                              {isSelected && <Text style={styles.optionCheck}>✓</Text>}
                            </TouchableOpacity>
                          );
                        })}

                        {/* Custom Option Item at bottom of list */}
                        <TouchableOpacity
                          style={styles.customOptionBtn}
                          onPress={() => {
                            setCustomMode((prev) => ({ ...prev, [field.id]: true }));
                            setField(field.id, '');
                            setOpenDropdown(null);
                          }}
                          activeOpacity={0.75}
                        >
                          <View style={styles.customOptionIconBox}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.customOptionTitle}>+ Other (Add your own)</Text>
                            <Text style={styles.customOptionSub}>Type custom {field.label.toLowerCase()}</Text>
                          </View>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}
                </>
              )}
              {!!errors[field.id] && <Text style={styles.error}>{errors[field.id]}</Text>}
            </View>
          );
        }

        if (field.type === 'textarea') {
          const max = field.maxLength || 120;
          const len = (values[field.id] || '').length;
          return (
            <View key={field.id} style={styles.fieldGroup}>
              <Text style={styles.label}>
                {field.label} <Text style={styles.optionalHint}>(optional)</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textarea, errors[field.id] && styles.inputError]}
                value={values[field.id] || ''}
                onChangeText={(t) => setField(field.id, t.slice(0, max))}
                placeholder={field.placeholder || ''}
                placeholderTextColor="#94a3b8"
                multiline
                accessibilityLabel={field.label}
              />
              <Text style={styles.counter}>{len}/{max}</Text>
              {!!errors[field.id] && <Text style={styles.error}>{errors[field.id]}</Text>}
            </View>
          );
        }

        const isCompulsory = isFieldCompulsory(field);
        return (
          <View key={field.id} style={styles.fieldGroup}>
            <Text style={styles.label}>
              {field.label}
              {isCompulsory ? <Text style={styles.requiredStar}> *</Text> : <Text style={styles.optionalHint}> (optional)</Text>}
            </Text>
            <TextInput
              style={[styles.input, errors[field.id] && styles.inputError]}
              value={values[field.id] || ''}
              onChangeText={(t) => setField(field.id, t)}
              placeholder={field.placeholder || ''}
              placeholderTextColor="#94a3b8"
              keyboardType={field.keyboardType || 'default'}
              accessibilityLabel={field.label}
            />
            {!!errors[field.id] && <Text style={styles.error}>{errors[field.id]}</Text>}
          </View>
        );
      })}
    </View>
  );
}

export function isFieldCompulsory(field) {
  if (!field) return false;
  if (field.id === 'notes') return false;
  if (field.type === 'textarea') return false;
  const labelLower = (field.label || '').toLowerCase();
  if (labelLower.includes('additional detail') || labelLower.includes('optional')) return false;
  return true;
}

export function validateApplianceFields(fields, values = {}) {
  const errors = {};
  (fields || [])
    .filter((f) => f.id !== 'condition' && (f.label || '').toLowerCase() !== 'condition')
    .forEach((field) => {
      if (!isFieldCompulsory(field)) return;

      if (field.type === 'brand') {
        const brand = (values.brand || '').trim();
        if (!brand) {
          errors.brand = 'Please select a company.';
        } else if (brand === OTHER_BRAND && !(values.customBrand || '').trim()) {
          errors.brand = 'Please enter the company name.';
        }
        return;
      }

      const v = values[field.id];
      if (v == null || String(v).trim() === '') {
        errors[field.id] = `Please ${field.type === 'select' ? 'select' : 'enter'} ${field.label}.`;
      }
    });
  return errors;
}

export function resolveBrandName(values) {
  if (values.brand === OTHER_BRAND) return (values.customBrand || '').trim() || OTHER_BRAND;
  return values.brand || '';
}

const styles = StyleSheet.create({
  form: { gap: 14, width: '100%' },
  fieldGroup: { gap: 6, width: '100%', position: 'relative' },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  requiredStar: {
    color: '#ef4444',
    fontWeight: '700',
  },
  optionalHint: {
    color: '#94a3b8',
    fontWeight: '400',
    fontSize: 11,
  },
  customToggleLink: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563eb',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    cursor: 'pointer',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    outlineStyle: 'none',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  inputError: { borderColor: '#f87171' },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  customInputField: {
    flex: 1,
  },
  chooseListBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1.2,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  chooseListBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1d4ed8',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: { fontSize: 13, color: '#0f172a', fontFamily: "'Outfit', 'Inter', sans-serif" },
  placeholder: { color: '#94a3b8' },
  chevron: { color: '#64748b', fontSize: 12 },
  menu: {
    position: 'absolute',
    top: 66,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    zIndex: 99,
    boxShadow: '0 10px 30px rgba(15,23,42,0.18)',
    overflow: 'hidden',
  },
  menuScroll: {
    maxHeight: 220,
    ...(Platform.OS === 'web' ? { maxHeight: 220, overflowY: 'auto' } : {}),
  },
  menuScrollContent: {
    paddingVertical: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    cursor: 'pointer',
  },
  optionSelected: {
    backgroundColor: '#eff6ff',
  },
  optionText: {
    fontSize: 13,
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    flex: 1,
  },
  optionTextSelected: {
    color: '#2563eb',
    fontWeight: '700',
  },
  optionCheck: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '800',
    marginLeft: 8,
  },
  customOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1.5,
    borderTopColor: '#e2e8f0',
    cursor: 'pointer',
  },
  customOptionIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  customOptionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1d4ed8',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  customOptionSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  counter: { fontSize: 10.5, color: '#94a3b8', textAlign: 'right' },
  error: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
});
