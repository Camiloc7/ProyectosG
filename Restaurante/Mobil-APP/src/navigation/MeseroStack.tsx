import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import MeseroDashboard from "../screens/MeseroDashboard";
import OrderTakingScreen from "../screens/OrderTakingScreen";
import MeseroReadyOrdersScreen from "../screens/MeseroReadyOrdersScreen";

import { MeseroStackParamList } from "../types/navigation";
import TopBar from "../components/TopBar";

const Stack = createStackNavigator<MeseroStackParamList>();

function MeseroStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MeseroDashboard" component={MeseroDashboard} />
      <Stack.Screen name="OrderTakingScreen" component={OrderTakingScreen} />
      <Stack.Screen
        name="MeseroReadyOrdersScreen"
        component={MeseroReadyOrdersScreen}
      />
    </Stack.Navigator>
  );
}

export default MeseroStack;
