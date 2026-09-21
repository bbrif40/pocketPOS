import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from './types';
import { SettingsHomeScreen } from '../screens/settings/SettingsHomeScreen';
import { PlanSwitcherScreen } from '../screens/settings/PlanSwitcherScreen';
import { BranchesScreen } from '../screens/settings/BranchesScreen';
import { StaffScreen } from '../screens/settings/StaffScreen';
import { AccountScreen } from '../screens/settings/AccountScreen';
import { PreferencesScreen } from '../screens/settings/PreferencesScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="SettingsHome"
        component={SettingsHomeScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="PlanSwitcher"
        component={PlanSwitcherScreen}
        options={{ title: '🛠 Dev: Switch Plan' }}
      />
      <Stack.Screen name="Branches" component={BranchesScreen} options={{ title: 'Branches' }} />
      <Stack.Screen name="Staff" component={StaffScreen} options={{ title: 'Staff' }} />
      <Stack.Screen name="Account" component={AccountScreen} options={{ title: 'Account' }} />
      <Stack.Screen
        name="Preferences"
        component={PreferencesScreen}
        options={{ title: 'Preferences' }}
      />
    </Stack.Navigator>
  );
}
