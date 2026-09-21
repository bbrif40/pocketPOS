/**
 * PocketPOS — App entry point
 *
 * Boot sequence:
 * 1. NavigationContainer wraps the whole app for React Navigation.
 * 2. DatabaseProvider opens/migrates the local SQLite DB before rendering screens.
 * 3. loadPlan() hydrates the entitlements module from AsyncStorage.
 * 4. RootNavigator renders the four-tab shell.
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

import { DatabaseProvider } from './src/context/DatabaseContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { loadPlan } from './src/entitlements/entitlements';

export default function App() {
  useEffect(() => {
    // Pre-load plan from AsyncStorage so entitlements are ready before any
    // screen renders. Runs async but fails silently (defaults to 'free').
    loadPlan();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer>
        <DatabaseProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </DatabaseProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
