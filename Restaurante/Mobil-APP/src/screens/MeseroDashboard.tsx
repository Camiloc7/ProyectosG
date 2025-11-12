import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  BackHandler,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { fetchMesas } from "../api/mesas";
import { Mesa } from "../types/models";
import Icon from "react-native-vector-icons/FontAwesome";
import { StackNavigationProp } from "@react-navigation/stack";
import { MeseroStackParamList } from "../types/navigation";
import { COLOR } from "../constants/colors";
import { styles as commonStyles } from "../styles/commonStyles";
import { useFocusEffect } from "@react-navigation/native";

type MeseroDashboardNavigationProp = StackNavigationProp<
  MeseroStackParamList,
  "MeseroDashboard"
>;
interface MeseroDashboardProps {
  navigation: MeseroDashboardNavigationProp;
}

function MeseroDashboard({ navigation }: MeseroDashboardProps) {
  const authContext = useContext(AuthContext);
  if (!authContext)
    throw new Error("AuthContext must be used within an AuthProvider");

  const { signOut, userToken, user } = authContext;
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMesas = useCallback(async () => {
    if (!userToken || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchMesas(userToken, user.establecimiento_id);
      setMesas(data);
    } catch (error: any) {
      console.error("Error al obtener mesas:", error.message);
      Alert.alert("Error", "No se pudieron cargar las mesas.");
    } finally {
      setLoading(false);
    }
  }, [userToken, user]);

  useEffect(() => {
    loadMesas();

    const unsubscribe = navigation.addListener("focus", () => {
      loadMesas();
    });

    return unsubscribe;
  }, [navigation, loadMesas]);

  // dentro de MeseroDashboard:
  useFocusEffect(
    useCallback(() => {
      // helper para mostrar el alert (reutilizable)
      const showConfirm = (originEvent?: any) => {
        Alert.alert(
          "¿Cerrar sesión?",
          "Tendras que volver a poner tus credenciales para volver a ingresar",
          [
            {
              text: "Cancelar",
              style: "cancel",
              onPress: () => {
                // si queremos permitir la acción original (salir), podríamos dispatch(e.data.action).
                // Aquí "Continuar" cancela la salida y se queda en la pantalla.
              },
            },
            {
              text: "Cerrar Sesión",
              style: "destructive",
              onPress: () => {
                // cerrar sesión (tu función)
                signOut();
                // si originEvent?.data?.action y quieres ejecutar la acción original:
                // navigation.dispatch(originEvent.data.action);
              },
            },
          ],
          { cancelable: true }
        );
      };

      // 1) listener para acciones de navegación (header back, gestos, navigation.goBack())
      const beforeRemoveHandler = (e: any) => {
        e.preventDefault(); // evita que la pantalla se cierre inmediatamente
        showConfirm(e);
      };
      const unsubscribeBeforeRemove = navigation.addListener(
        "beforeRemove",
        beforeRemoveHandler
      );

      // 2) listener para botón físico de Android
      const hardwareBackHandler = () => {
        // Si quieres permitir el comportamiento normal cuando hay rutas previas:
        // if (navigation.canGoBack()) return false; // deja que navigation haga goBack()
        // Si quieres siempre preguntar (p. ej. en root), mostramos confirm
        showConfirm();
        return true; // importante: devuelve true para indicar que manejaste el evento
      };
      const backSub = BackHandler.addEventListener(
        "hardwareBackPress",
        hardwareBackHandler
      );

      // cleanup
      return () => {
        unsubscribeBeforeRemove();
        backSub.remove(); // en RN moderno usar .remove()
      };
    }, [navigation, signOut])
  );

  const getStatusIndicatorColor = (estado: Mesa["estado"]) => {
    switch (estado) {
      case "LIBRE":
        return COLOR.STATUS_LIBRE;
      case "OCUPADA":
        return COLOR.STATUS_OCUPADA;
      case "MANTENIMIENTO":
        return COLOR.STATUS_MANTENIMIENTO;
      default:
        return COLOR.TEXT_MUTED;
    }
  };

  const renderMesaItem = ({ item }: { item: Mesa }) => {
    const statusIndicatorBg = getStatusIndicatorColor(item.estado);

    return (
      <TouchableOpacity
        style={commonStyles.mesaCard}
        onPress={() => navigation.navigate("OrderTakingScreen", { mesa: item })}
        activeOpacity={0.7}
      >
        <View style={commonStyles.cardIconContainer}>
          <Icon name="cutlery" size={30} color={COLOR.ORANGE} />
          <Text style={commonStyles.mesaNumber}>{item.numero}</Text>
        </View>
        <View style={commonStyles.cardDetails}>
          <Text style={commonStyles.mesaCapacity}>
            Capacidad: {item.capacidad}
          </Text>
          <View style={commonStyles.statusRow}>
            <View
              style={[
                commonStyles.statusIndicator,
                { backgroundColor: statusIndicatorBg },
              ]}
            />
            <Text style={commonStyles.mesaStatusText}>{item.estado}</Text>
          </View>
        </View>
        <View style={commonStyles.cardArrow}>
          <Icon name="chevron-right" size={20} color={COLOR.TEXT_MUTED} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLOR.ORANGE} />
        <Text style={commonStyles.loadingText}>Cargando mesas...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={commonStyles.container}>
        <Text style={commonStyles.title}>Mesas</Text>
        <Text style={commonStyles.subtitle}>
          Selecciona una mesa para gestionar
        </Text>

        {/* --- BOTÓN PARA PEDIDOS LISTOS --- */}
        <TouchableOpacity
          style={commonStyles.reviewOrderButton}
          onPress={() => navigation.navigate("MeseroReadyOrdersScreen")}
        >
          <Icon
            name="bell"
            size={20}
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <Text style={commonStyles.reviewOrderButtonText}>
            Ver Pedidos Listos
          </Text>
        </TouchableOpacity>

        <FlatList
          data={mesas}
          keyExtractor={(item) => item.id}
          renderItem={renderMesaItem}
          contentContainerStyle={commonStyles.flatListContent}
          ListEmptyComponent={
            <View style={commonStyles.emptyListContainer}>
              <Icon
                name="exclamation-circle"
                size={50}
                color={COLOR.TEXT_MUTED}
                style={commonStyles.emptyListIcon}
              />
              <Text style={commonStyles.emptyListText}>
                No hay mesas disponibles.
              </Text>
              <Text style={commonStyles.emptyListSubText}>
                Verifica la configuración o intenta de nuevo.
              </Text>
            </View>
          }
        />
        {/* <TouchableOpacity style={commonStyles.logoutButton} onPress={signOut}>
          <Icon
            name="sign-out"
            size={20}
            color="#fff"
            style={commonStyles.logoutIcon}
          />
          <Text style={commonStyles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});

export default MeseroDashboard;
