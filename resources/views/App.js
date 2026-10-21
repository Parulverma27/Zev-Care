import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import AppRouter from './src/router/AppRouter';

// Dedicated Separate Vanilla CSS Stylesheets
import './src/styles/index.css';
import './src/styles/UserApp.css';
import './src/styles/ProviderApp.css';
import './src/styles/AdminPanel.css';

export default function App() {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const fontId = 'zevota-luxury-fonts';
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap';
        document.head.appendChild(link);
      }
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </SafeAreaProvider>
  );
}
