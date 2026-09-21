/**
 * PocketPOS — Root tab navigator
 * Four tabs: Sell (Home), Products, Reports, Settings.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { SellStack } from './SellStack';
import { ProductsStack } from './ProductsStack';
import { ReportsStack } from './ReportsStack';
import { SettingsStack } from './SettingsStack';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof RootTabParamList, { focused: IoniconName; unfocused: IoniconName }> =
  {
    Sell: { focused: 'cart', unfocused: 'cart-outline' },
    Products: { focused: 'cube', unfocused: 'cube-outline' },
    Reports: { focused: 'bar-chart', unfocused: 'bar-chart-outline' },
    Settings: { focused: 'settings', unfocused: 'settings-outline' },
  };

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#17352b',
        tabBarInactiveTintColor: '#637c71',
        tabBarStyle: {
          backgroundColor: '#f8faf7',
          borderTopColor: '#c8d8cc',
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name as keyof RootTabParamList];
          const name = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Sell" component={SellStack} options={{ title: 'Sell' }} />
      <Tab.Screen name="Products" component={ProductsStack} options={{ title: 'Products' }} />
      <Tab.Screen name="Reports" component={ReportsStack} options={{ title: 'Reports' }} />
      <Tab.Screen name="Settings" component={SettingsStack} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}
