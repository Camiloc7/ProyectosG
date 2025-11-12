// src/screens/ErrorRoleScreen.tsx
import React, { useContext } from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { AuthContext } from "../context/AuthContext";
import { UserRole } from "../types/auth"; // Asegúrate de importar UserRole

// Colores definidos
const COLOR_ORANGE = "#ed4e05";

interface ErrorRoleScreenProps {
  userRole?: UserRole | null; // Puedes pasar el rol como prop si lo deseas, o tomarlo del contexto
}

function ErrorRoleScreen({ userRole }: ErrorRoleScreenProps) {
  const authContext = useContext(AuthContext);
  if (!authContext)
    throw new Error("AuthContext must be used within an AuthProvider");
  const { signOut, userRole: contextUserRole } = authContext; // Obtener el rol del contexto también

  const displayRole = userRole || contextUserRole || "desconocido";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acceso Denegado</Text>
      <Text style={styles.errorText}>
        Tu rol ({displayRole}) no tiene una vista asignada. Contacta al
        administrador.
      </Text>
      <Button title="Cerrar Sesión" onPress={signOut} color={COLOR_ORANGE} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffe0e0", // Fondo más claro para errores
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#D32F2F", // Rojo oscuro para el título de error
    fontFamily: "Lato",
  },
  errorText: {
    fontSize: 18,
    color: "#C62828", // Rojo para el texto de error
    textAlign: "center",
    marginBottom: 30,
    fontFamily: "Lato",
  },
});

export default ErrorRoleScreen;
