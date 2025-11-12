import React from "react";
import AuthProvider from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { LogBox } from "react-native";

LogBox.ignoreAllLogs(); // Opcional: oculta warnings de RN

// Manejo global de errores JS
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.log("[GlobalError]", error.message);
  if (isFatal) {
    // Puedes incluso guardar el error en AsyncStorage para revisarlo después
  }
});

function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
export default App;
