import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CocineroDashboard from '../screens/CocineroDashboard';
import { CocinaStackParamList } from '../types/navigation';

const Stack = createStackNavigator<CocinaStackParamList>();

function CocineroStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CocineroDashboard" component={CocineroDashboard} />
    </Stack.Navigator>
  );
}

export default CocineroStack;