import React from 'react';
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
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </SafeAreaProvider>
  );
}
