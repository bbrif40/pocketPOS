import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ReportsStackParamList } from './types';
import { ReportsHomeScreen } from '../screens/reports/ReportsHomeScreen';
import { DailySummaryScreen } from '../screens/reports/DailySummaryScreen';
import { WeeklySummaryScreen } from '../screens/reports/WeeklySummaryScreen';
import { AnalyticsScreen } from '../screens/reports/AnalyticsScreen';
import { ExpensesScreen } from '../screens/reports/ExpensesScreen';
import { ExportReportScreen } from '../screens/reports/ExportReportScreen';
import { LoanReadinessScreen } from '../screens/reports/LoanReadinessScreen';

const Stack = createNativeStackNavigator<ReportsStackParamList>();

export function ReportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ReportsHome"
        component={ReportsHomeScreen}
        options={{ title: 'Reports' }}
      />
      <Stack.Screen
        name="DailySummary"
        component={DailySummaryScreen}
        options={{ title: 'Daily Summary' }}
      />
      <Stack.Screen
        name="WeeklySummary"
        component={WeeklySummaryScreen}
        options={{ title: 'Weekly Summary' }}
      />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
      <Stack.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Expenses' }} />
      <Stack.Screen
        name="ExportReport"
        component={ExportReportScreen}
        options={{ title: 'Export' }}
      />
      <Stack.Screen
        name="LoanReadiness"
        component={LoanReadinessScreen}
        options={{ title: 'Loan-Ready Report' }}
      />
    </Stack.Navigator>
  );
}
