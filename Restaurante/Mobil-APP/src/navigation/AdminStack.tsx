import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import CreateProductScreen from '../screens/CreateProductScreen';
import AdminPurchaseRegisterScreen from '../screens/AdminPurchaseRegisterScreen';
import AdminIngredientManagementScreen from '../screens/AdminIngredientManagementScreen'; 

import { AdminStackParamList } from '../types/navigation';
import AdminUserManagementScreen from '../screens/AdminUserManagementScreen';
import AdminMesaManagementScreen from '../screens/AdminMesaManagementScreen';

const Stack = createStackNavigator<AdminStackParamList>();

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="CreateProductScreen" component={CreateProductScreen} />
      <Stack.Screen name="AdminPurchaseRegisterScreen" component={AdminPurchaseRegisterScreen} />
      <Stack.Screen name="AdminIngredientManagementScreen" component={AdminIngredientManagementScreen} /> 
      <Stack.Screen name="AdminUserManagementScreen" component={AdminUserManagementScreen} /> 
      <Stack.Screen name="AdminMesaManagementScreen" component={AdminMesaManagementScreen} /> 
    </Stack.Navigator>
  );
}

export default AdminStack;
