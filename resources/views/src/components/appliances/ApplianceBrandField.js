import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { APPLIANCE_BRANDS, OTHER_BRAND } from '../../config/applianceBrands';

export default function ApplianceBrandField({
  value = '',
  customBrand = '',
  onChangeBrand,
  onChangeCustomBrand,
  error = '',
}) {
  const [query, setQuery] = useState(value && value !== OTHER_BRAND ? value : '');

  useEffect(() => {
    if (value && value !== OTHER_BRAND) {
      setQuery(value);
    } else if (!value) {
      setQuery('');
    }
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // If empty or matches the currently selected brand, display all popular brands so chips remain browsable
    if (!q || (value && q === value.toLowerCase())) return APPLIANCE_BRANDS;
    return APPLIANCE_BRANDS.filter((b) => b.toLowerCase().includes(q));
  }, [query, value]);

  const isOther = value === OTHER_BRAND;

  const handleSelectBrand = (brand) => {
    onChangeBrand?.(brand);
    setQuery(brand);
  };

  const handleClear = () => {
    setQuery('');
    if (value && value !== OTHER_BRAND) {
      onChangeBrand?.('');
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Company{error ? '' : ''}</Text>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            const exactMatch = APPLIANCE_BRANDS.find((b) => b.toLowerCase() === text.trim().toLowerCase());
            if (exactMatch) {
              onChangeBrand?.(exactMatch);
            }
          }}
          placeholder="Search company"
          placeholderTextColor="#94a3b8"
          accessibilityLabel="Search company"
        />
        {!!query && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearBtn}
            accessibilityLabel="Clear company selection"
            activeOpacity={0.7}
          >
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.grid}>
        {filtered.map((brand) => {
          const selected = value === brand;
          return (
            <TouchableOpacity
              key={brand}
              style={[styles.brandChip, selected && styles.brandChipSelected]}
              onPress={() => handleSelectBrand(brand)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={brand}
            >
              <Text style={[styles.brandText, selected && styles.brandTextSelected]} numberOfLines={1}>
                {brand}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {filtered.length === 0 && (
        <Text style={styles.empty}>No companies found. Choose Other below.</Text>
      )}

      <View style={[styles.otherRow, isOther && styles.otherRowSelected]}>
        <TouchableOpacity
          style={styles.radioTouch}
          onPress={() => {
            onChangeBrand?.(OTHER_BRAND);
            setQuery('');
          }}
          activeOpacity={0.85}
          accessibilityRole="radio"
          accessibilityState={{ checked: isOther }}
          accessibilityLabel="Select other company"
        >
          <View style={styles.radio}>
            {isOther ? <View style={styles.radioInner} /> : null}
          </View>
        </TouchableOpacity>
        <TextInput
          style={styles.otherInput}
          value={customBrand}
          onFocus={() => {
            if (!isOther) onChangeBrand?.(OTHER_BRAND);
            setQuery('');
          }}
          onChangeText={(t) => {
            onChangeCustomBrand?.(t);
            if (!isOther) onChangeBrand?.(OTHER_BRAND);
            setQuery('');
          }}
          placeholder="Other (Add company name)"
          placeholderTextColor="#64748b"
          accessibilityLabel="Other company name"
        />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, width: '100%' },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 14, color: '#94a3b8' },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    outlineStyle: 'none',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  clearBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    minWidth: '30%',
    flexGrow: 1,
    alignItems: 'center',
  },
  brandChipSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  brandText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  brandTextSelected: { color: '#1d4ed8' },
  empty: { fontSize: 12, color: '#94a3b8', textAlign: 'center', paddingVertical: 8 },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  radioTouch: {
    paddingVertical: 4,
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  otherInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    outlineStyle: 'none',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  error: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
});
