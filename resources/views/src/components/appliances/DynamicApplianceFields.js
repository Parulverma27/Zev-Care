import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import ApplianceBrandField from './ApplianceBrandField';
import { OTHER_BRAND } from '../../config/applianceBrands';

export default function DynamicApplianceFields({
  fields = [],
  values = {},
  errors = {},
  onChange,
}) {
  const [openDropdown, setOpenDropdown] = useState(null);

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
          return (
            <View key={field.id} style={[styles.fieldGroup, { zIndex: isOpen ? 40 : 1 }]}>
              <Text style={styles.label}>
                {field.label}
                {isCompulsory ? <Text style={styles.requiredStar}> *</Text> : <Text style={styles.optionalHint}> (optional)</Text>}
              </Text>
              <TouchableOpacity
                style={[styles.input, styles.dropdown, errors[field.id] && styles.inputError]}
                onPress={() => setOpenDropdown(isOpen ? null : field.id)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={field.label}
              >
                <Text style={[styles.inputText, !values[field.id] && styles.placeholder]}>
                  {values[field.id] || `Select ${field.label}`}
                </Text>
                <Text style={styles.chevron}>▾</Text>
              </TouchableOpacity>
              {isOpen && (
                <View style={styles.menu}>
                  {(field.options || []).map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={styles.option}
                      onPress={() => {
                        setField(field.id, opt);
                        setOpenDropdown(null);
                      }}
                    >
                      <Text style={styles.optionText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    maxHeight: 200,
    overflow: 'hidden',
    zIndex: 50,
    boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  optionText: { fontSize: 12.5, color: '#0f172a', fontFamily: "'Outfit', 'Inter', sans-serif" },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  counter: { fontSize: 10.5, color: '#94a3b8', textAlign: 'right' },
  error: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
});
