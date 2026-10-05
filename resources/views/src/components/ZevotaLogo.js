import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const logoImage = require('../../assets/logo.png');

const SIZES = {
  header: { width: 50, height: 50 },
  auth: { width: 110, height: 110 },
  small: { width: 58, height: 58 },
  medium: { width: 84, height: 84 },
  large: { width: 128, height: 128 },
};

export default function ZevotaLogo({ size = 'medium' }) {
  const dimensions = SIZES[size] || SIZES.medium;

  return (
    <View style={[styles.container, dimensions]}>
      <Image
        source={logoImage}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});
