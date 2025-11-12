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
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/FontAwesome";
import { Picker } from "@react-native-picker/picker";

import { AuthContext } from "../context/AuthContext";
import {
  fetchIngredientes,
  createIngrediente,
  updateIngrediente,
  deleteIngrediente,
} from "../api/ingredientes";
import {
  Ingrediente,
  CreateIngredienteDto,
  UpdateIngredienteDto,
} from "../types/models";
import { AdminStackParamList } from "../types/navigation";

import { COLOR } from "../constants/colors";
import { styles as commonStyles } from "../styles/commonStyles";

type AdminIngredientManagementScreenNavigationProp = StackNavigationProp<
  AdminStackParamList,
  "AdminIngredientManagementScreen"
>;

interface AdminIngredientManagementScreenProps {
  navigation: AdminIngredientManagementScreenNavigationProp;
}

// Unidades de medida comunes para la definición del ingrediente base
const UNIDADES_MEDIDA = [
  "gramos",
  "kilogramos",
  "libras",
  "onzas",
  "mililitros",
  "litros",
  "galones",
  "unidades",
  "piezas",
  "paquetes",
  "cajas",
  "botellas",
  "latas",
  "sacos",
  "bultos",
];

function AdminIngredientManagementScreen({
  navigation,
}: AdminIngredientManagementScreenProps) {
  const authContext = useContext(AuthContext);
  if (!authContext)
    throw new Error("AuthContext must be used within an AuthProvider");
  const { userToken, user } = authContext;
  const establecimientoId = user?.establecimiento_id;

  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIngrediente, setCurrentIngrediente] =
    useState<Ingrediente | null>(null);

  // Estados para el formulario de ingrediente
  const [nombre, setNombre] = useState("");
  const [unidadMedida, setUnidadMedida] = useState(UNIDADES_MEDIDA[0]);
  const [stockActual, setStockActual] = useState("");
  const [stockMinimo, setStockMinimo] = useState("");
  const [costoUnitario, setCostoUnitario] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const loadIngredientes = useCallback(async () => {
    if (!userToken || !establecimientoId) {
      setLoading(false);
      return;
    }

    setRefreshing(true);
    try {
      const fetchedIngredientes = await fetchIngredientes(
        userToken,
        establecimientoId
      );
      setIngredientes(fetchedIngredientes);
    } catch (error: any) {
      console.error("Error al cargar ingredientes:", error.message);
      Alert.alert("Error", "No se pudieron cargar los ingredientes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken, establecimientoId]);

  useEffect(() => {
    loadIngredientes();
    const unsubscribeFocus = navigation.addListener("focus", () => {
      loadIngredientes();
    });
    return unsubscribeFocus;
  }, [navigation, loadIngredientes]);

  const resetForm = () => {
    setNombre("");
    setUnidadMedida(UNIDADES_MEDIDA[0]);
    setStockActual("");
    setStockMinimo("");
    setCostoUnitario("");
    setObservaciones("");
    setIsEditing(false);
    setCurrentIngrediente(null);
  };

  const handleOpenModal = (ingrediente?: Ingrediente) => {
    if (ingrediente) {
      setIsEditing(true);
      setCurrentIngrediente(ingrediente);
      setNombre(ingrediente.nombre);
      setUnidadMedida(ingrediente.unidad_medida);
      setStockActual(ingrediente.stock_actual.toString());
      setStockMinimo(ingrediente.stock_minimo.toString());
      setCostoUnitario(ingrediente.costo_unitario.toString());
      setObservaciones(ingrediente.observaciones || "");
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const handleSaveIngrediente = async () => {
    if (
      !nombre ||
      !unidadMedida ||
      !stockActual ||
      !stockMinimo ||
      !costoUnitario
    ) {
      Alert.alert(
        "Error",
        "Por favor, completa todos los campos obligatorios."
      );
      return;
    }

    const currentStock = parseFloat(stockActual);
    const minStock = parseFloat(stockMinimo);
    const unitCost = parseFloat(costoUnitario);

    if (
      isNaN(currentStock) ||
      currentStock < 0 ||
      isNaN(minStock) ||
      minStock < 0 ||
      isNaN(unitCost) ||
      unitCost < 0
    ) {
      Alert.alert("Error", "Stock y costo deben ser números positivos o cero.");
      return;
    }

    const ingredienteData: CreateIngredienteDto | UpdateIngredienteDto = {
      nombre,
      unidad_medida: unidadMedida,
      stock_actual: currentStock,
      stock_minimo: minStock,
      costo_unitario: unitCost,
      observaciones: observaciones || undefined,
    };

    setLoading(true);
    try {
      if (isEditing && currentIngrediente) {
        await updateIngrediente(
          currentIngrediente.id,
          ingredienteData as UpdateIngredienteDto,
          userToken!
        );
        Alert.alert("Éxito", "Ingrediente actualizado exitosamente.");
      } else {
        await createIngrediente(
          {
            ...ingredienteData,
            establecimiento_id: establecimientoId!,
          } as CreateIngredienteDto,
          userToken!
        );
        Alert.alert("Éxito", "Ingrediente creado exitosamente.");
      }
      setModalVisible(false);
      loadIngredientes();
    } catch (error: any) {
      console.error("Error al guardar ingrediente:", error.message);
      Alert.alert(
        "Error",
        error.message || "No se pudo guardar el ingrediente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIngrediente = (ingredienteId: string) => {
    Alert.alert(
      "Confirmar Eliminación",
      "¿Estás seguro de que deseas eliminar este ingrediente? Esta acción no se puede deshacer y afectará las compras y productos relacionados.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteIngrediente(ingredienteId, userToken!);
              Alert.alert("Éxito", "Ingrediente eliminado exitosamente.");
              loadIngredientes();
            } catch (error: any) {
              console.error("Error al eliminar ingrediente:", error.message);
              Alert.alert(
                "Error",
                error.message || "No se pudo eliminar el ingrediente."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderIngredienteItem = ({ item }: { item: Ingrediente }) => (
    <View style={styles.ingredienteCard}>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Nombre:</Text>
        <Text style={styles.cardValue}>{item.nombre}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Unidad:</Text>
        <Text style={styles.cardValue}>{item.unidad_medida}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Stock:</Text>
        <Text style={styles.cardValue}>
          {item.stock_actual} / {item.stock_minimo}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Costo Unitario:</Text>
        <Text style={styles.cardValue}>
          ${parseFloat(item.costo_unitario.toString()).toFixed(2)}
        </Text>
      </View>
      {item.observaciones && (
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Notas:</Text>
          <Text style={styles.cardValue}>{item.observaciones}</Text>
        </View>
      )}
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => handleOpenModal(item)}
          style={[styles.actionButton, styles.editButton]}
        >
          <Icon name="edit" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteIngrediente(item.id)}
          style={[styles.actionButton, styles.deleteButton]}
        >
          <Icon name="trash" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLOR.ORANGE} />
        <Text style={commonStyles.loadingText}>Cargando ingredientes...</Text>
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
          <Text style={commonStyles.title}>Gestión de Ingredientes</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={commonStyles.subtitle}>
          Crea y actualiza tus ingredientes de cocina
        </Text>

        <TouchableOpacity
          style={commonStyles.reviewOrderButton}
          onPress={() => handleOpenModal()}
        >
          <Icon
            name="plus-circle"
            size={20}
            color="#fff"
            style={{ marginRight: 10 }}
          />
          <Text style={commonStyles.reviewOrderButtonText}>
            Crear Nuevo Ingrediente
          </Text>
        </TouchableOpacity>

        <FlatList
          data={ingredientes}
          keyExtractor={(item) => item.id}
          renderItem={renderIngredienteItem}
          contentContainerStyle={commonStyles.flatListContent}
          ListEmptyComponent={
            <View style={commonStyles.emptyListContainer}>
              <Icon
                name="lemon-o"
                size={50}
                color={COLOR.TEXT_MUTED}
                style={commonStyles.emptyListIcon}
              />
              <Text style={commonStyles.emptyListText}>
                No hay ingredientes registrados.
              </Text>
              <Text style={commonStyles.emptyListSubText}>
                ¡Añade los ingredientes que usas en tu cocina!
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadIngredientes}
              tintColor={COLOR.ORANGE}
            />
          }
        />

        {/* Modal para crear/editar ingrediente */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={commonStyles.modalOverlay}>
            <View style={commonStyles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={commonStyles.modalTitle}>
                  {isEditing ? "Editar Ingrediente" : "Crear Ingrediente"}
                </Text>

                <Text style={styles.formLabel}>Nombre:</Text>
                <TextInput
                  style={commonStyles.textInput}
                  placeholder="Ej. Harina de Trigo"
                  value={nombre}
                  onChangeText={setNombre}
                />

                <Text style={styles.formLabel}>Unidad de Medida:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={unidadMedida}
                    onValueChange={(itemValue) => setUnidadMedida(itemValue)}
                    style={styles.picker}
                  >
                    {UNIDADES_MEDIDA.map((unit) => (
                      <Picker.Item
                        key={unit}
                        label={unit.charAt(0).toUpperCase() + unit.slice(1)}
                        value={unit}
                      />
                    ))}
                  </Picker>
                </View>

                <Text style={styles.formLabel}>Stock Actual:</Text>
                <TextInput
                  style={commonStyles.textInput}
                  keyboardType="numeric"
                  placeholder="Ej. 5000 (gramos)"
                  value={stockActual}
                  onChangeText={setStockActual}
                />

                <Text style={styles.formLabel}>Stock Mínimo:</Text>
                <TextInput
                  style={commonStyles.textInput}
                  keyboardType="numeric"
                  placeholder="Ej. 1000 (gramos)"
                  value={stockMinimo}
                  onChangeText={setStockMinimo}
                />

                <Text style={styles.formLabel}>Costo Unitario (Promedio):</Text>
                <TextInput
                  style={commonStyles.textInput}
                  keyboardType="numeric"
                  placeholder="Ej. 0.05 (por gramo)"
                  value={costoUnitario}
                  onChangeText={setCostoUnitario}
                />

                <Text style={styles.formLabel}>Observaciones (Opcional):</Text>
                <TextInput
                  style={[commonStyles.textInput, styles.notesInput]}
                  placeholder="Notas sobre el ingrediente"
                  multiline
                  numberOfLines={3}
                  value={observaciones}
                  onChangeText={setObservaciones}
                />

                <TouchableOpacity
                  style={[
                    commonStyles.submitOrderButton,
                    loading && commonStyles.submitOrderButtonDisabled,
                  ]}
                  onPress={handleSaveIngrediente}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={commonStyles.submitOrderButtonText}>
                      {isEditing ? "Guardar Cambios" : "Crear Ingrediente"}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={commonStyles.modalCloseButton}
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text style={commonStyles.modalCloseButtonText}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ingredienteCard: {
    backgroundColor: COLOR.CARD_COMPONENT_BG,
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
  cardRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLOR.TEXT_DARK,
    fontFamily: "Lato",
    width: 120,
  },
  cardValue: {
    fontSize: 15,
    color: COLOR.TEXT_MUTED,
    fontFamily: "Lato",
    flex: 1,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginLeft: 10,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
    fontFamily: "Lato",
  },
  editButton: {
    backgroundColor: COLOR.ORANGE,
  },
  deleteButton: {
    backgroundColor: "#DC3545",
  },
  formLabel: {
    fontSize: 16,
    color: COLOR.TEXT_DARK,
    fontFamily: "Lato",
    marginBottom: 8,
    marginTop: 15,
    fontWeight: "bold",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
    backgroundColor: COLOR.CARD_COMPONENT_BG,
  },
  picker: {
    height: 50,
    width: "100%",
    color: COLOR.TEXT_DARK,
  },
  notesInput: {
    height: 100,
    textAlignVertical: "top",
  },
});

export default AdminIngredientManagementScreen;
