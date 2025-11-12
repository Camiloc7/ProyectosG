import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/FontAwesome";
import { AuthContext } from "../context/AuthContext";
import { fetchPedidos, updatePedidoStatus } from "../api/pedidos";
import { MeseroStackParamList } from "../types/navigation";
import { COLOR } from "../constants/colors";
import { styles as commonStyles } from "../styles/commonStyles";
import { EstadoPedido, Pedido, TipoPedido } from "../types/models";

type MeseroReadyOrdersScreenNavigationProp = StackNavigationProp<
  MeseroStackParamList,
  "MeseroReadyOrdersScreen"
>;

interface MeseroReadyOrdersScreenProps {
  navigation: MeseroReadyOrdersScreenNavigationProp;
}

function MeseroReadyOrdersScreen({ navigation }: MeseroReadyOrdersScreenProps) {
  const authContext = useContext(AuthContext);
  if (!authContext)
    throw new Error("AuthContext must be used within an AuthProvider");
  const { userToken, user } = authContext;
  const establecimientoId = user?.establecimiento_id;

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReadyOrders = useCallback(async () => {
    if (!userToken || !establecimientoId) {
      setLoading(false);
      return;
    }

    setRefreshing(true);
    try {
      const readyOrders = await fetchPedidos(
        userToken,
        establecimientoId,
        EstadoPedido.LISTO_PARA_ENTREGAR
      );

      const mesaOrders = readyOrders.filter(
        (pedido) => pedido.tipo_pedido === "MESA"
      );
      setPedidos(mesaOrders);
    } catch (error: any) {
      console.error(
        "Error al obtener pedidos listos para mesero:",
        error.message
      );
      Alert.alert("Error", "No se pudieron cargar los pedidos listos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken, establecimientoId]);

  useEffect(() => {
    loadReadyOrders();

    const unsubscribeFocus = navigation.addListener("focus", () => {
      loadReadyOrders();
    });

    const intervalId = setInterval(loadReadyOrders, 30000);

    return () => {
      unsubscribeFocus();
      clearInterval(intervalId);
    };
  }, [navigation, loadReadyOrders]);

  const handleMarkAsClosed = async (pedidoId: string) => {
    if (!userToken) return;

    Alert.alert(
      "Confirmar Cierre de Pedido",
      '¿Estás seguro de que deseas marcar este pedido como "Cerrado"? Esto indica que el servicio en mesa ha finalizado y está listo para el pago.',
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              setLoading(true);
              await updatePedidoStatus(
                userToken,
                pedidoId,
                EstadoPedido.ENTREGADO
              );
              Alert.alert("Éxito", 'Pedido marcado como "Cerrado"');
              loadReadyOrders();
            } catch (error: any) {
              console.error("Error al cerrar pedido:", error.message);
              Alert.alert(
                "Error",
                error.message || "No se pudo cerrar el pedido."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderPedidoItem = ({ item }: { item: Pedido }) => (
    <View style={commonStyles.pedidoCard}>
      <View style={commonStyles.cardHeader}>
        <View style={commonStyles.pedidoIdContainer}>
          <Icon
            name="tag"
            size={18}
            color={COLOR.TEXT_DARK}
            style={{ marginRight: 5 }}
          />
          <Text style={commonStyles.pedidoIdText}>
            Pedido #{item.id.substring(0, 8)}
          </Text>
        </View>
        <View
          style={[
            commonStyles.statusBadge,
            { backgroundColor: COLOR.STATUS_LIBRE },
          ]}
        >
          <Icon
            name="check-circle"
            size={14}
            color="#fff"
            style={{ marginRight: 5 }}
          />
          <Text style={commonStyles.statusBadgeText}>Listo para Entregar</Text>
        </View>
      </View>

      <View style={commonStyles.cardBody}>
        <View style={commonStyles.mesaInfo}>
          <Icon
            name="cutlery"
            size={16}
            color={COLOR.TEXT_MUTED}
            style={{ marginRight: 8 }}
          />
          <Text style={commonStyles.mesaText}>
            Mesa: {item.mesa?.numero || "N/A"}
          </Text>
        </View>

        <Text style={commonStyles.itemsTitle}>Ítems del Pedido:</Text>
        {item.pedidoItems && item.pedidoItems.length > 0 ? (
          item.pedidoItems.map((prodItem, index) => (
            <View key={index} style={commonStyles.itemRow}>
              <Text style={commonStyles.itemQuantity}>
                {prodItem.cantidad}x
              </Text>
              <Text style={commonStyles.itemName}>
                {prodItem.producto?.nombre || "Producto Desconocido"}
              </Text>
              {prodItem.notas_item && (
                <Text style={commonStyles.itemNotes}>
                  ({prodItem.notas_item})
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={commonStyles.noItemsText}>
            No hay ítems en este pedido.
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[commonStyles.actionButton, { backgroundColor: COLOR.ORANGE }]}
        onPress={() => handleMarkAsClosed(item.id)}
      >
        <Text style={commonStyles.actionButtonText}>Marcar como Cerrado</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLOR.ORANGE} />
        <Text style={commonStyles.loadingText}>Cargando pedidos listos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={commonStyles.container}>
        <View style={commonStyles.header}>
          <TouchableOpacity
            style={commonStyles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color={COLOR.TEXT_DARK} />
            <Text style={commonStyles.backButtonText}>Volver</Text>
          </TouchableOpacity>
          <Text style={commonStyles.title}>Pedidos Listos para Servir</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={commonStyles.subtitle}>
          Pedidos de mesa listos para entregar al cliente
        </Text>

        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id}
          renderItem={renderPedidoItem}
          contentContainerStyle={commonStyles.flatListContent}
          ListEmptyComponent={
            <View style={commonStyles.emptyListContainer}>
              <Icon
                name="check-square-o"
                size={50}
                color={COLOR.TEXT_MUTED}
                style={commonStyles.emptyListIcon}
              />
              <Text style={commonStyles.emptyListText}>
                ¡No hay pedidos listos para servir!
              </Text>
              <Text style={commonStyles.emptyListSubText}>
                Espera que la cocina prepare más.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadReadyOrders}
              tintColor={COLOR.ORANGE}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});

export default MeseroReadyOrdersScreen;
