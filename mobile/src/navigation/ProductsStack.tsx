import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProductsStackParamList } from './types';
import { ProductListScreen } from '../screens/products/ProductListScreen';
import { AddProductScreen } from '../screens/products/AddProductScreen';
import { AdjustStockScreen } from '../screens/products/AdjustStockScreen';

const Stack = createNativeStackNavigator<ProductsStackParamList>();

export function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{ title: 'Products' }}
      />
      <Stack.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{ title: 'Add / Edit Product' }}
      />
      <Stack.Screen
        name="AdjustStock"
        component={AdjustStockScreen}
        options={{ title: 'Adjust Stock' }}
      />
    </Stack.Navigator>
  );
}
