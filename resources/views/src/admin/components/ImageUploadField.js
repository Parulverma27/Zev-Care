import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { resolveImageUri } from '../../utils/imageUtils';

export default function ImageUploadField({ label = 'Image', value, onChangeImage, placeholder = 'Paste Image URL or Upload File' }) {
  const triggerFilePicker = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const rawUrl = event.target?.result;
            if (rawUrl && typeof rawUrl === 'string') {
              const img = document.createElement('img');
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_DIM = 300;
                let width = img.width;
                let height = img.height;
                if (width > MAX_DIM || height > MAX_DIM) {
                  if (width >= height) {
                    height = Math.round((height * MAX_DIM) / width);
                    width = MAX_DIM;
                  } else {
                    width = Math.round((width * MAX_DIM) / height);
                    height = MAX_DIM;
                  }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5);
                onChangeImage(compressedDataUrl);
              };
              img.onerror = () => {
                onChangeImage(rawUrl);
              };
              img.src = rawUrl;
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeImage}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={styles.uploadBtn} onPress={triggerFilePicker} activeOpacity={0.8}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <Text style={styles.uploadBtnText}>Upload File</Text>
        </TouchableOpacity>
      </View>

      {Boolean(value && value.trim()) && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: resolveImageUri(value) }} style={styles.previewImg} resizeMode="cover" />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.previewTitle}>Image Preview</Text>
            <Text style={styles.previewSub} numberOfLines={1}>
              {value.startsWith('data:') ? 'Local device image attached' : value}
            </Text>
          </View>
          <TouchableOpacity style={styles.clearBtn} onPress={() => onChangeImage('')} activeOpacity={0.7}>
            <Text style={styles.clearBtnText}>✕ Remove</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    marginVertical: 4,
    width: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    width: '100%',
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 12.5,
    color: '#0f172a',
    outlineStyle: 'none',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    flexShrink: 0,
    cursor: 'pointer',
  },
  uploadBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: 4,
  },
  previewImg: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  previewTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  previewSub: {
    fontSize: 10.5,
    color: '#64748b',
  },
  clearBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearBtnText: {
    color: '#dc2626',
    fontSize: 10.5,
    fontWeight: '700',
  },
});
