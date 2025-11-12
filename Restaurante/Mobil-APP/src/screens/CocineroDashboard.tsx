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
import { AuthContext } from "../context/AuthContext";
import { fetchPedidos, updatePedidoStatus } from "../api/pedidos";
import Icon from "react-native-vector-icons/FontAwesome";
import { Establecimiento, Mesa, PedidoItem, TipoPedido } from "../types/models";

const COLOR_BACKGROUND = "#e8eaec";
const COLOR_CARD_COMPONENT_BG = "#ffffff";
const COLOR_ORANGE = "#ed4e05";
const COLOR_TEXT_DARK = "#263238";
const COLOR_TEXT_MUTED = "#607d8b";

const PEDIDO_PENDIENTE_COLOR = "#FFC107";
const PEDIDO_PREPARANDO_COLOR = "#2196F3";
const PEDIDO_LISTO_COLOR = "#4CAF50";
const PEDIDO_CANCELADO_COLOR = "#9E9E9E";
const PEDIDO_ENTREGADO_COLOR = "#757575";

export enum EstadoPedido {
  ABIERTO = "ABIERTO",
  EN_PREPARACION = "EN_PREPARACION",
  LISTO_PARA_ENTREGAR = "LISTO_PARA_ENTREGAR",
  CERRADO = "CERRADO",
  PAGADO = "PAGADO",
  CANCELADO = "CANCELADO",
  ENTREGADO = "ENTREGADO",
  LISTO = "LISTO",
}

export interface Pedido {
  id: string;
  establecimiento_id: string;
  mesa_id?: string;
  usuario_creador_id: string;
  usuario_domiciliario_id?: string;
  estado: EstadoPedido;
  tipo_pedido: TipoPedido;
  total_estimado: number;
  cliente_nombre?: string;
  cliente_direccion?: string;
  cliente_telefono?: string;
  fecha_hora_cierre?: string;
  created_at: string;
  updated_at: string;
  mesa?: Mesa;
  establecimiento?: Establecimiento;
  usuarioCreador?: any;
  usuarioDomiciliario?: any;
  pedidoItems: PedidoItem[];
}

function CocineroDashboard() {
  const authContext = useContext(AuthContext);
  if (!authContext)
    throw new Error("AuthContext must be used within an AuthProvider");
  const { signOut, userToken, user } = authContext;
  const establecimientoId = user?.establecimiento_id;

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPedidos = useCallback(async () => {
    if (!userToken || !establecimientoId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // ✅ 1. Solo se obtienen los pedidos ABIERTOS y EN_PREPARACION
      const pendingPedidos = await fetchPedidos(
        userToken,
        establecimientoId,
        EstadoPedido.ABIERTO
      );
      const preparingPedidos = await fetchPedidos(
        userToken,
        establecimientoId,
        EstadoPedido.EN_PREPARACION
      );

      // ✅ 2. Eliminamos la llamada para obtener pedidos LISTO_PARA_ENTREGAR
      // const readyPedidos = await fetchPedidos(userToken, establecimientoId, EstadoPedido.LISTO_PARA_ENTREGAR);

      // ✅ 3. Unimos solo los pedidos que deben mostrarse en cocina
      const allRelevantPedidos = [...pendingPedidos, ...preparingPedidos].sort(
        (a, b) => {
          const statusOrder: Record<EstadoPedido, number> = {
            [EstadoPedido.ABIERTO]: 1,
            [EstadoPedido.EN_PREPARACION]: 2,
            [EstadoPedido.LISTO_PARA_ENTREGAR]: 3,
            [EstadoPedido.CERRADO]: 4,
            [EstadoPedido.PAGADO]: 5,
            [EstadoPedido.CANCELADO]: 6,
            [EstadoPedido.ENTREGADO]: 7,
            [EstadoPedido.LISTO]: 8,
          };
          const aOrder = statusOrder[a.estado] || 99;
          const bOrder = statusOrder[b.estado] || 99;

          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }
      );
      setPedidos(allRelevantPedidos);
    } catch (error: any) {
      console.error("Error al obtener pedidos de cocina:", error.message);
      Alert.alert("Error", "No se pudieron cargar los pedidos de cocina.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken, establecimientoId]);

  useEffect(() => {
    loadPedidos();
    const interval = setInterval(loadPedidos, 30000);
    return () => clearInterval(interval);
  }, [loadPedidos]);

  const handleUpdateOrderStatus = async (
    pedidoId: string,
    currentStatus: Pedido["estado"]
  ) => {
    if (!userToken) return;

    let newStatus: EstadoPedido;
    let confirmationMessage = "";

    if (currentStatus === EstadoPedido.ABIERTO) {
      newStatus = EstadoPedido.EN_PREPARACION;
      confirmationMessage = '¿Marcar este pedido como "En Preparación"?';
    } else if (currentStatus === EstadoPedido.EN_PREPARACION) {
      newStatus = EstadoPedido.LISTO_PARA_ENTREGAR;
      confirmationMessage = '¿Marcar este pedido como "Listo para Entregar"?';
    } else {
      Alert.alert("Info", "Este pedido ya está listo o en un estado final.");
      return;
    }

    Alert.alert("Confirmar Acción", confirmationMessage, [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Confirmar",
        onPress: async () => {
          try {
            setLoading(true);
            await updatePedidoStatus(userToken, pedidoId, newStatus);
            Alert.alert("Éxito", `Pedido actualizado a "${newStatus}"`);
            loadPedidos();
          } catch (error: any) {
            console.error(
              "Error al actualizar estado del pedido:",
              error.message
            );
            Alert.alert("Error", "No se pudo actualizar el estado del pedido.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: Pedido["estado"]) => {
    switch (status) {
      case EstadoPedido.ABIERTO:
        return PEDIDO_PENDIENTE_COLOR;
      case EstadoPedido.EN_PREPARACION:
        return PEDIDO_PREPARANDO_COLOR;
      case EstadoPedido.LISTO_PARA_ENTREGAR:
        return PEDIDO_LISTO_COLOR;
      case EstadoPedido.ENTREGADO:
        return PEDIDO_ENTREGADO_COLOR;
      case EstadoPedido.CANCELADO:
        return PEDIDO_CANCELADO_COLOR;
      default:
        return COLOR_TEXT_MUTED;
    }
  };

  const getStatusIcon = (status: Pedido["estado"]) => {
    switch (status) {
      case EstadoPedido.ABIERTO:
        return "hourglass-start";
      case EstadoPedido.EN_PREPARACION:
        return "fire";
      case EstadoPedido.LISTO_PARA_ENTREGAR:
        return "check-circle";
      case EstadoPedido.ENTREGADO:
        return "truck";
      case EstadoPedido.CANCELADO:
        return "times-circle";
      default:
        return "question-circle";
    }
  };

  const getButtonText = (status: Pedido["estado"]) => {
    switch (status) {
      case EstadoPedido.ABIERTO:
        return "Empezar Preparación";
      case EstadoPedido.EN_PREPARACION:
        return "Marcar como Listo";
      case EstadoPedido.LISTO_PARA_ENTREGAR:
        return "Listo (Esperando Entrega)";
      case EstadoPedido.ENTREGADO:
        return "Pedido Entregado";
      case EstadoPedido.CANCELADO:
        return "Pedido Cancelado";
      default:
        return "Estado Desconocido";
    }
  };

  const renderPedidoItem = ({ item }: { item: Pedido }) => (
    <View style={styles.pedidoCard}>
      <View style={styles.cardHeader}>
        <View style={styles.pedidoIdContainer}>
          <Icon
            name="tag"
            size={18}
            color={COLOR_TEXT_DARK}
            style={{ marginRight: 5 }}
          />
          <Text style={styles.pedidoIdText}>
            Pedido #{item.id.substring(0, 8)}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.estado) },
          ]}
        >
          <Icon
            name={getStatusIcon(item.estado)}
            size={14}
            color={
              item.estado === EstadoPedido.ABIERTO ? COLOR_TEXT_DARK : "#fff"
            }
            style={{ marginRight: 5 }}
          />
          <Text
            style={[
              styles.statusBadgeText,
              {
                color:
                  item.estado === EstadoPedido.ABIERTO
                    ? COLOR_TEXT_DARK
                    : "#fff",
              },
            ]}
          >
            {item.estado}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.mesaInfo}>
          <Icon
            name="cutlery"
            size={16}
            color={COLOR_TEXT_MUTED}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.mesaText}>
            Mesa: {item.mesa?.numero || "N/A"}
          </Text>
        </View>

        <Text style={styles.itemsTitle}>Ítems del Pedido:</Text>
        {item.pedidoItems && item.pedidoItems.length > 0 ? ( // Cambiado de item.items a item.pedidoItems
          item.pedidoItems.map(
            (
              prodItem,
              index // Cambiado de item.items a item.pedidoItems
            ) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemQuantity}>{prodItem.cantidad}x</Text>
                <Text style={styles.itemName}>{prodItem.producto.nombre}</Text>
                {prodItem.notas_item && ( // Cambiado de prodItem.notas a prodItem.notas_item
                  <Text style={styles.itemNotes}>({prodItem.notas_item})</Text>
                )}
              </View>
            )
          )
        ) : (
          <Text style={styles.noItemsText}>No hay ítems en este pedido.</Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: getStatusColor(item.estado) },
        ]}
        onPress={() => handleUpdateOrderStatus(item.id, item.estado)}
        // Deshabilitar si el estado ya está LISTO_PARA_ENTREGAR, ENTREGADO o CANCELADO
        disabled={
          item.estado === EstadoPedido.LISTO_PARA_ENTREGAR ||
          item.estado === EstadoPedido.ENTREGADO ||
          item.estado === EstadoPedido.CANCELADO
        }
      >
        <Text style={styles.actionButtonText}>
          {getButtonText(item.estado)}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLOR_ORANGE} />
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Panel de Cocina</Text>
          {/* <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Icon name="sign-out" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Salir</Text>
        </TouchableOpacity> */}
        </View>
        <Text style={styles.subtitle}>Pedidos Pendientes y En Preparación</Text>

        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id}
          renderItem={renderPedidoItem}
          contentContainerStyle={styles.flatListContent}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Icon
                name="coffee"
                size={50}
                color={COLOR_TEXT_MUTED}
                style={styles.emptyListIcon}
              />
              <Text style={styles.emptyListText}>
                ¡No hay pedidos pendientes!
              </Text>
              <Text style={styles.emptyListSubText}>
                Es hora de un descanso.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadPedidos}
              tintColor={COLOR_ORANGE}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLOR_BACKGROUND,
  },
  container: {
    flex: 1,
    backgroundColor: COLOR_BACKGROUND,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLOR_BACKGROUND,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: COLOR_TEXT_MUTED,
    fontFamily: "Lato",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: COLOR_TEXT_DARK,
    fontFamily: "Lato",
  },
  subtitle: {
    fontSize: 18,
    color: COLOR_TEXT_MUTED,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Lato",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLOR_ORANGE,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    shadowColor: COLOR_ORANGE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
    fontFamily: "Lato",
  },
  flatListContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  pedidoCard: {
    backgroundColor: COLOR_CARD_COMPONENT_BG,
    borderRadius: 15,
    padding: 20,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    width: "100%",
    borderColor: "#e0e0e0",
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 10,
  },
  pedidoIdContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pedidoIdText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLOR_TEXT_DARK,
    fontFamily: "Lato",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Lato",
  },
  cardBody: {
    marginBottom: 15,
  },
  mesaInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  mesaText: {
    fontSize: 16,
    color: COLOR_TEXT_MUTED,
    fontFamily: "Lato",
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLOR_TEXT_DARK,
    marginBottom: 8,
    fontFamily: "Lato",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLOR_ORANGE,
    marginRight: 8,
    fontFamily: "Lato",
  },
  itemName: {
    fontSize: 15,
    color: COLOR_TEXT_DARK,
    flex: 1,
    fontFamily: "Lato",
  },
  itemNotes: {
    fontSize: 13,
    color: COLOR_TEXT_MUTED,
    fontFamily: "Lato",
    marginLeft: 5,
    fontStyle: "italic",
  },
  noItemsText: {
    fontSize: 14,
    color: COLOR_TEXT_MUTED,
    fontStyle: "italic",
    fontFamily: "Lato",
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
    fontFamily: "Lato",
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyListIcon: {
    marginBottom: 20,
  },
  emptyListText: {
    fontSize: 20,
    color: COLOR_TEXT_MUTED,
    textAlign: "center",
    fontFamily: "Lato",
    marginBottom: 10,
  },
  emptyListSubText: {
    fontSize: 16,
    color: COLOR_TEXT_MUTED,
    textAlign: "center",
    fontFamily: "Lato",
  },
});

export default CocineroDashboard;
