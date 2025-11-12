import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ErrorRoleScreen from '../screens/ErrorRoleScreen'; 

type ErrorStackParamList = {
  ErrorRole: undefined;
};

const Stack = createStackNavigator<ErrorStackParamList>();

function ErrorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ErrorRole" component={ErrorRoleScreen} />
    </Stack.Navigator>
  );
}

export default ErrorStack;