import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View, StyleSheet, Text } from "react-native";

import { AuthContext } from "../context/AuthContext";
import AuthStack from "./AuthStack";
import MeseroStack from "./MeseroStack";
import CocineroStack from "./CocineroStack";
import AdminStack from "./AdminStack";
import ErrorStack from "./ErrorStack";

import { RootStackParamList } from "../types/navigation";
import TopBar from "../components/TopBar";

const RootStack = createNativeStackNavigator<RootStackParamList>();

function AppStackContent() {
  const authContext = useContext(AuthContext);
  if (!authContext)
    throw new Error("AuthContext must be used within an AuthProvider");

  const { userRole } = authContext;

  if (!userRole) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Verificando rol del usuario...</Text>
      </View>
    );
  }

  try {
    return (
      <View style={{ flex: 1 }}>
        <TopBar />
        <View style={{ flex: 1 }}>
          {userRole === "MESERO" && <MeseroStack />}
          {userRole === "COCINERO" && <CocineroStack />}
          {userRole === "ADMIN" && <AdminStack />}
          {!["MESERO", "COCINERO", "ADMIN"].includes(userRole) && (
            <ErrorStack />
          )}
        </View>
      </View>
    );
  } catch (error) {
    console.error("Error en AppStackContent:", error);
    return <ErrorStack />;
  }
}

function AppNavigator() {
  const authContext = useContext(AuthContext);
  if (!authContext)
    throw new Error("AuthContext must be used within an AuthProvider");

  const { userToken, isLoading } = authContext;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Cargando aplicación...</Text>
      </View>
    );
  }

  try {
    return (
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {userToken ? (
            <RootStack.Screen name="App" component={AppStackContent} />
          ) : (
            <RootStack.Screen name="Auth" component={AuthStack} />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    );
  } catch (error) {
    console.error("Error en AppNavigator:", error);
    return (
      <View style={styles.loadingContainer}>
        <Text>Ocurrió un error crítico al iniciar la app.</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AppNavigator;
