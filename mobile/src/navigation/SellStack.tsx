import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SellStackParamList } from './types';
import { SellHomeScreen } from '../screens/sell/SellHomeScreen';
import { TodayScreen } from '../screens/sell/TodayScreen';
import { TransactionHistoryScreen } from '../screens/sell/TransactionHistoryScreen';

const Stack = createNativeStackNavigator<SellStackParamList>();

export function SellStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SellHome" component={SellHomeScreen} options={{ title: 'Sell' }} />
      <Stack.Screen name="Today" component={TodayScreen} options={{ title: "Today's Sales" }} />
      <Stack.Screen
        name="TransactionHistory"
        component={TransactionHistoryScreen}
        options={{ title: 'History' }}
      />
    </Stack.Navigator>
  );
}
