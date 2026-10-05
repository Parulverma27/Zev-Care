import React from 'react';
import { StatusBar } from 'expo-status-bar';
import UserWebViewShell from './src/native/UserWebViewShell';

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <UserWebViewShell />
    </>
  );
}
