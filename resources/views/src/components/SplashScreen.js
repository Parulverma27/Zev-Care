import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Image, StyleSheet, Platform } from 'react-native';

const splashImage = require('../../assets/splash-screen.png');

export default function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setDone(true);
        onFinish && onFinish();
      });
    }, 1800);

    return () => clearTimeout(timer);
  }, [fadeAnim, onFinish]);

  if (done) return null;

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]} pointerEvents="auto">
      <Image
        source={splashImage}
        style={styles.splashImageFull}
        resizeMode="cover"
        accessibilityLabel="Zevota Care splash screen"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...(Platform.OS === 'web'
      ? { position: 'fixed' }
      : { position: 'absolute' }),
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    minHeight: Platform.OS === 'web' ? '100vh' : undefined,
    zIndex: 99999,
    backgroundColor: '#022e83',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImageFull: {
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web' ? { objectFit: 'cover' } : {}),
  },
});
