import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { loginUser } from "../api/auth";
import { Ionicons } from "@expo/vector-icons";

const COLOR_INPUT_BG = "#fafafa";
const COLOR_BACKGROUND = "#fafafa";
const COLOR_ORANGE = "#ed4e05";

function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  const authContext = useContext(AuthContext);

  if (!authContext) {
    return (
      <Text style={styles.errorText}>Error: AuthContext no disponible</Text>
    );
  }

  const { signIn } = authContext;

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Por favor, ingresa tu usuario y contraseña.");
      return;
    }
    if (!acceptedTerms) {
      Alert.alert(
        "Error",
        "Debes aceptar los términos y condiciones para continuar."
      );
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(username, password);
      await signIn(data.access_token);
    } catch (error: any) {
      console.error("Error de login:", error.message);
      Alert.alert(
        "Error de Login",
        error.message || "Credenciales inválidas o error de red."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Text style={styles.title}>Gastro POS</Text>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/logoCeleste.webp")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={{ alignItems: "center" }}>
            <Text style={styles.subtitle}>
              {` Con Quality, facturas y cobras sin esperar.
Construya con liquidez. 
Facture con Quality`}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Usuario"
              placeholderTextColor="#bbb"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Contraseña"
                placeholderTextColor="#bbb"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ padding: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={24}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (loading || !acceptedTerms) && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading || !acceptedTerms}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <View style={styles.termsContainer}>
              <TouchableOpacity
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                style={[
                  styles.checkbox,
                  acceptedTerms && {
                    backgroundColor: COLOR_ORANGE,
                    borderColor: COLOR_ORANGE,
                  },
                ]}
                activeOpacity={0.8}
              >
                {acceptedTerms && (
                  <Ionicons name="checkmark" size={18} color="#fff" />
                )}
              </TouchableOpacity>
              <Text style={styles.termsText}>
                Acepto los{" "}
                <Text
                  style={{
                    color: COLOR_ORANGE,
                    textDecorationLine: "underline",
                  }}
                  onPress={() => {
                    Alert.alert(
                      "Términos y Condiciones",
                      `Política de Privacidad para la Aplicación "Quality Soft Service"
Última actualización: Enero 2025

1. Introducción
En "Quality Soft Service", valoramos su privacidad y nos comprometemos a proteger sus datos personales. Esta Política describe cómo recopilamos, usamos, compartimos y protegemos su información.

2. Información que Recopilamos
2.1 Información Personal: Nombre, correo, teléfono, datos de facturación.
2.2 Información Automática: Dispositivo, uso de la app, ubicación (si está habilitada).

3. Uso de la Información
Proveer y mejorar servicios, gestionar facturación, comunicarnos con usted, cumplir obligaciones legales.

4. Compartir Información
No compartimos salvo que lo exija la ley o con proveedores bajo confidencialidad.

5. Seguridad
Medidas técnicas y organizativas para proteger datos.

6. Derechos
Acceder, corregir, eliminar, oponerse al tratamiento.

7. Conservación
Solo el tiempo necesario o lo exigido por ley.

8. Cambios
Podemos actualizar esta política y notificaremos en la app.

9. Contacto
Correo: envios@qualitysoftservice.com
Tel: +57 310-3188070

10. Uso de Cookies
Usamos cookies para seguridad, personalización y buen funcionamiento.

Gracias por confiar en nosotros. Su privacidad es nuestra prioridad.`
                    );
                  }}
                >
                  Términos y Condiciones
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: COLOR_BACKGROUND,
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
    marginRight: 8, // espacio entre texto y logo
    color: "#000",
  },
  logoContainer: {
    width: 30,
    height: 30,
  },
  logo: {
    width: "100%",
    height: "100%",
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
    fontFamily: "Lato",
    lineHeight: 20,
  },
  input: {
    width: "100%",
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 25,
    backgroundColor: "transparent",
    fontSize: 16,
    color: "#37474f",
    fontFamily: "Lato",
  },
  passwordContainer: {
    width: "100%",
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 25,
    backgroundColor: "transparent",
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: "#37474f",
    fontFamily: "Lato",
  },
  button: {
    width: "100%",
    height: 55,
    backgroundColor: COLOR_ORANGE,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: COLOR_ORANGE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#f7b07b",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Lato",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginTop: 20,
    fontFamily: "Lato",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#ccc",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  termsText: {
    fontSize: 13,
    color: "#666",
    fontFamily: "Lato",
  },
});

export default LoginScreen;
