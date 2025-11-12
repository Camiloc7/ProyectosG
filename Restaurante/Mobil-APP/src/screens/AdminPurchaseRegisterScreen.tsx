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
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/FontAwesome";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import { AuthContext } from "../context/AuthContext";
import {
  fetchCompras,
  createCompra,
  fetchCompraById,
  updateCompra,
  deleteCompra,
  updateIngredienteStock,
} from "../api/compras";
import { fetchIngredientes } from "../api/ingredientes";
import { fetchProveedores } from "../api/proveedores";
import {
  Compra,
  CreateCompraDto,
  UpdateCompraDto,
  Ingrediente,
  Proveedor,
  TipoPedido,
} from "../types/models";
import { AdminStackParamList } from "../types/navigation";

import { COLOR } from "../constants/colors";
import { styles as commonStyles } from "../styles/commonStyles";

type AdminPurchaseRegisterScreenNavigationProp = StackNavigationProp<
  AdminStackParamList,
  "AdminPurchaseRegisterScreen"
>;

interface AdminPurchaseRegisterScreenProps {
  navigation: AdminPurchaseRegisterScreenNavigationProp;
}

// Unidades de medida comunes para la compra (pueden ser diferentes a las del ingrediente base)
const UNIDADES_MEDIDA_COMPRA = [
  "unidades",
  "piezas",
  "paquetes",
  "cajas",
  "gramos",
  "kilogramos",
  "libras",
  "onzas",
  "mililitros",
  "litros",
  "galones",
  "botellas",
  "latas",
  "sacos",
  "bultos",
];

function AdminPurchaseRegisterScreen({
  navigation,
}: AdminPurchaseRegisterScreenProps) {
  const authContext = useContext(AuthContext);
  if (!authContext)
    throw new Error("AuthContext must be used within an AuthProvider");
  const { userToken, user } = authContext;
  const establecimientoId = user?.establecimiento_id;

  const [compras, setCompras] = useState<Compra[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCompra, setCurrentCompra] = useState<Compra | null>(null);

  // Estados para el formulario de compra
  const [selectedIngrediente, setSelectedIngrediente] = useState<string | null>(
    null
  );
  const [selectedProveedor, setSelectedProveedor] = useState<string | null>(
    null
  );
  const [cantidadComprada, setCantidadComprada] = useState("");
  const [unidadMedidaCompra, setUnidadMedidaCompra] = useState(
    UNIDADES_MEDIDA_COMPRA[0]
  );
  const [costoUnitarioCompra, setCostoUnitarioCompra] = useState("");
  const [fechaCompra, setFechaCompra] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [numeroFactura, setNumeroFactura] = useState("");
  const [notas, setNotas] = useState("");

  // Estados para la búsqueda en los Pickers
  const [ingredienteSearchTerm, setIngredienteSearchTerm] = useState("");
  const [proveedorSearchTerm, setProveedorSearchTerm] = useState("");

  const loadData = useCallback(async () => {
    if (!userToken || !establecimientoId) {
      setLoading(false);
      return;
    }

    setRefreshing(true);
    try {
      const fetchedCompras = await fetchCompras(userToken, establecimientoId);
      const fetchedIngredientes = await fetchIngredientes(
        userToken,
        establecimientoId
      );
      const fetchedProveedores = await fetchProveedores(userToken);

      setCompras(
        fetchedCompras.sort(
          (a, b) =>
            new Date(b.fecha_compra).getTime() -
            new Date(a.fecha_compra).getTime()
        )
      );
      setIngredientes(fetchedIngredientes);
      setProveedores(fetchedProveedores);
    } catch (error: any) {
      console.error("Error al cargar datos de compras:", error.message);
      Alert.alert(
        "Error",
        "No se pudieron cargar los datos de compras, ingredientes o proveedores."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken, establecimientoId]);

  useEffect(() => {
    loadData();
    const unsubscribeFocus = navigation.addListener("focus", () => {
      loadData();
    });
    return unsubscribeFocus;
  }, [navigation, loadData]);

  const resetForm = () => {
    setSelectedIngrediente(null);
    setSelectedProveedor(null);
    setCantidadComprada("");
    setUnidadMedidaCompra(UNIDADES_MEDIDA_COMPRA[0]);
    setCostoUnitarioCompra("");
    setFechaCompra(new Date());
    setNumeroFactura("");
    setNotas("");
    setIsEditing(false);
    setCurrentCompra(null);
    setIngredienteSearchTerm("");
    setProveedorSearchTerm("");
  };

  const handleOpenModal = (compra?: Compra) => {
    if (compra) {
      setIsEditing(true);
      setCurrentCompra(compra);
      setSelectedIngrediente(compra.ingrediente_id);
      setSelectedProveedor(compra.proveedor_id);
      setCantidadComprada(compra.cantidad_comprada.toString());
      setUnidadMedidaCompra(
        compra.unidad_medida_compra || UNIDADES_MEDIDA_COMPRA[0]
      );
      setCostoUnitarioCompra(compra.costo_unitario_compra?.toString() || "");
      setFechaCompra(new Date(compra.fecha_compra));
      setNumeroFactura(compra.numero_factura || "");
      setNotas(compra.notas || "");
      setIngredienteSearchTerm(
        ingredientes.find((ing) => ing.id === compra.ingrediente_id)?.nombre ||
          ""
      );
      setProveedorSearchTerm(
        proveedores.find((prov) => prov.id === compra.proveedor_id)?.nombre ||
          ""
      );
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const handleSaveCompra = async () => {
    if (
      !selectedIngrediente ||
      !selectedProveedor ||
      !cantidadComprada ||
      !costoUnitarioCompra ||
      !unidadMedidaCompra
    ) {
      Alert.alert(
        "Error",
        "Por favor, completa todos los campos obligatorios."
      );
      return;
    }

    const cantidad = parseFloat(cantidadComprada);
    const costoUnitario = parseFloat(costoUnitarioCompra);

    if (isNaN(cantidad) || cantidad <= 0) {
      Alert.alert("Error", "La cantidad comprada debe ser un número positivo.");
      return;
    }
    if (isNaN(costoUnitario) || costoUnitario <= 0) {
      Alert.alert("Error", "El costo unitario debe ser un número positivo.");
      return;
    }

    const compraData: CreateCompraDto | UpdateCompraDto = {
      establecimiento_id: establecimientoId!,
      ingrediente_id: selectedIngrediente,
      proveedor_id: selectedProveedor,
      cantidad_comprada: cantidad,
      unidad_medida_compra: unidadMedidaCompra,
      costo_unitario_compra: costoUnitario,
      fecha_compra: fechaCompra.toISOString(),
      numero_factura: numeroFactura || undefined,
      notas: notas || undefined,
    };

    setLoading(true);
    try {
      if (isEditing && currentCompra) {
        await updateCompra(
          currentCompra.id,
          compraData as UpdateCompraDto,
          userToken!
        );
        Alert.alert("Éxito", "Compra actualizada exitosamente.");
      } else {
        await createCompra(compraData as CreateCompraDto, userToken!);
        Alert.alert("Éxito", "Compra registrada exitosamente.");

        // La actualización de stock ahora se maneja con conversión en el backend
        await updateIngredienteStock(
          selectedIngrediente,
          { cantidad: cantidad, tipo: "sumar" },
          userToken!
        );
        Alert.alert(
          "Stock Actualizado",
          `Se sumaron ${cantidad} unidades al stock del ingrediente.`
        );
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      console.error("Error al guardar compra:", error.message);
      Alert.alert("Error", error.message || "No se pudo guardar la compra.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompra = (compraId: string) => {
    Alert.alert(
      "Confirmar Eliminación",
      "¿Estás seguro de que deseas eliminar esta compra? Esta acción no se puede deshacer y afectará el stock del ingrediente.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteCompra(compraId, userToken!);
              Alert.alert("Éxito", "Compra eliminada exitosamente.");
              loadData();
            } catch (error: any) {
              console.error("Error al eliminar compra:", error.message);
              Alert.alert(
                "Error",
                error.message || "No se pudo eliminar la compra."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || fechaCompra;
    setShowDatePicker(Platform.OS === "ios");
    setFechaCompra(currentDate);
  };

  // Lógica de filtrado para ingredientes y proveedores
  const filteredIngredientes = ingredientes.filter((ing) =>
    ing.nombre.toLowerCase().includes(ingredienteSearchTerm.toLowerCase())
  );

  const filteredProveedores = proveedores.filter((prov) =>
    prov.nombre.toLowerCase().includes(proveedorSearchTerm.toLowerCase())
  );

  const renderCompraItem = ({ item }: { item: Compra }) => (
    <View style={styles.compraCard}>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Ingrediente:</Text>
        <Text style={styles.cardValue}>
          {item.ingrediente?.nombre || "Desconocido"}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Proveedor:</Text>
        <Text style={styles.cardValue}>
          {item.proveedor?.nombre || "Desconocido"}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Cantidad:</Text>
        <Text style={styles.cardValue}>
          {item.cantidad_comprada} {item.unidad_medida_compra || ""}{" "}
          {/* Muestra la unidad de medida de la compra */}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Costo Unitario:</Text>
        <Text style={styles.cardValue}>
          $
          {item.costo_unitario_compra
            ? parseFloat(item.costo_unitario_compra.toString()).toFixed(2)
            : "0.00"}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Costo Total:</Text>
        <Text style={styles.cardValue}>
          $
          {item.costo_total
            ? parseFloat(item.costo_total.toString()).toFixed(2)
            : "0.00"}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Fecha:</Text>
        <Text style={styles.cardValue}>
          {new Date(item.fecha_compra).toLocaleDateString()}
        </Text>
      </View>
      {item.numero_factura && (
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Factura:</Text>
          <Text style={styles.cardValue}>{item.numero_factura}</Text>
        </View>
      )}
      {item.notas && (
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Notas:</Text>
          <Text style={styles.cardValue}>{item.notas}</Text>
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
          onPress={() => handleDeleteCompra(item.id)}
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
        <Text style={commonStyles.loadingText}>Cargando compras...</Text>
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
          <Text style={commonStyles.title}>Registro de Compras</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={commonStyles.subtitle}>
          Gestiona las compras de ingredientes a proveedores
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
            Registrar Nueva Compra
          </Text>
        </TouchableOpacity>

        <FlatList
          data={compras}
          keyExtractor={(item) => item.id}
          renderItem={renderCompraItem}
          contentContainerStyle={commonStyles.flatListContent}
          ListEmptyComponent={
            <View style={commonStyles.emptyListContainer}>
              <Icon
                name="shopping-basket"
                size={50}
                color={COLOR.TEXT_MUTED}
                style={commonStyles.emptyListIcon}
              />
              <Text style={commonStyles.emptyListText}>
                No hay compras registradas.
              </Text>
              <Text style={commonStyles.emptyListSubText}>
                ¡Empieza a añadir tus compras de ingredientes!
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadData}
              tintColor={COLOR.ORANGE}
            />
          }
        />
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
                  {isEditing ? "Editar Compra" : "Registrar Compra"}
                </Text>

                {/* --- CAMBIOS PARA BÚSQUEDA DE INGREDIENTES --- */}
                <Text style={styles.formLabel}>Ingrediente:</Text>
                <TextInput
                  style={commonStyles.textInput}
                  placeholder="Buscar o seleccionar ingrediente..."
                  value={ingredienteSearchTerm}
                  onChangeText={setIngredienteSearchTerm}
                  editable={!isEditing}
                />
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedIngrediente}
                    onValueChange={(itemValue) => {
                      setSelectedIngrediente(itemValue);
                      const selected = ingredientes.find(
                        (ing) => ing.id === itemValue
                      );
                      if (selected) setIngredienteSearchTerm(selected.nombre);
                    }}
                    style={styles.picker}
                    enabled={!isEditing}
                  >
                    <Picker.Item
                      label="Selecciona un ingrediente"
                      value={null}
                    />
                    {filteredIngredientes.map((ing) => (
                      <Picker.Item
                        key={ing.id}
                        label={ing.nombre}
                        value={ing.id}
                      />
                    ))}
                  </Picker>
                </View>
                {!isEditing && (
                  <TouchableOpacity
                    style={[commonStyles.secondaryButton, styles.createButton]}
                    onPress={() =>
                      Alert.alert(
                        "Crear Ingrediente",
                        "Funcionalidad de creación de ingrediente en desarrollo."
                      )
                    }
                  >
                    <Icon
                      name="plus"
                      size={16}
                      color={COLOR.ORANGE}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        commonStyles.actionButtonText,
                        { color: COLOR.ORANGE },
                      ]}
                    >
                      Crear Nuevo Ingrediente
                    </Text>
                  </TouchableOpacity>
                )}
                {/* --- FIN CAMBIOS PARA BÚSQUEDA DE INGREDIENTES --- */}

                {/* --- CAMBIOS PARA BÚSQUEDA DE PROVEEDORES --- */}
                <Text style={styles.formLabel}>Proveedor:</Text>
                <TextInput
                  style={commonStyles.textInput}
                  placeholder="Buscar o seleccionar proveedor..."
                  value={proveedorSearchTerm}
                  onChangeText={setProveedorSearchTerm}
                />
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedProveedor}
                    onValueChange={(itemValue) => {
                      setSelectedProveedor(itemValue);
                      const selected = proveedores.find(
                        (prov) => prov.id === itemValue
                      );
                      if (selected) setProveedorSearchTerm(selected.nombre);
                    }}
                    style={styles.picker}
                  >
                    <Picker.Item label="Selecciona un proveedor" value={null} />
                    {filteredProveedores.map((prov) => (
                      <Picker.Item
                        key={prov.id}
                        label={prov.nombre}
                        value={prov.id}
                      />
                    ))}
                  </Picker>
                </View>
                <TouchableOpacity
                  style={[commonStyles.secondaryButton, styles.createButton]}
                  onPress={() =>
                    Alert.alert(
                      "Crear Proveedor",
                      "Funcionalidad de creación de proveedor en desarrollo."
                    )
                  }
                >
                  <Icon
                    name="plus"
                    size={16}
                    color={COLOR.ORANGE}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      commonStyles.actionButtonText,
                      { color: COLOR.ORANGE },
                    ]}
                  >
                    Crear Nuevo Proveedor
                  </Text>
                </TouchableOpacity>
                {/* --- FIN CAMBIOS PARA BÚSQUEDA DE PROVEEDORES --- */}

                <Text style={styles.formLabel}>Cantidad Comprada:</Text>
                <TextInput
                  style={commonStyles.textInput}
                  keyboardType="numeric"
                  placeholder="Ej. 100"
                  value={cantidadComprada}
                  onChangeText={setCantidadComprada}
                />

                {/* --- NUEVO CAMPO: UNIDAD DE MEDIDA DE COMPRA --- */}
                <Text style={styles.formLabel}>
                  Unidad de Medida de Compra:
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={unidadMedidaCompra}
                    onValueChange={(itemValue) =>
                      setUnidadMedidaCompra(itemValue)
                    }
                    style={styles.picker}
                  >
                    {UNIDADES_MEDIDA_COMPRA.map((unit) => (
                      <Picker.Item
                        key={unit}
                        label={unit.charAt(0).toUpperCase() + unit.slice(1)}
                        value={unit}
                      />
                    ))}
                  </Picker>
                </View>
                {/* ----------------------------------------------- */}

                <Text style={styles.formLabel}>Costo Unitario de Compra:</Text>
                <TextInput
                  style={commonStyles.textInput}
                  keyboardType="numeric"
                  placeholder="Ej. 2.50"
                  value={costoUnitarioCompra}
                  onChangeText={setCostoUnitarioCompra}
                />

                <Text style={styles.formLabel}>Fecha de Compra:</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.datePickerButton}
                >
                  <Text style={styles.datePickerButtonText}>
                    {fechaCompra.toLocaleDateString()}
                  </Text>
                  <Icon name="calendar" size={20} color={COLOR.TEXT_MUTED} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={fechaCompra}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                  />
                )}

                <Text style={styles.formLabel}>
                  Número de Factura (Opcional):
                </Text>
                <TextInput
                  style={commonStyles.textInput}
                  placeholder="Ej. INV-2025-001"
                  value={numeroFactura}
                  onChangeText={setNumeroFactura}
                />

                <Text style={styles.formLabel}>Notas (Opcional):</Text>
                <TextInput
                  style={[commonStyles.textInput, styles.notesInput]}
                  placeholder="Notas adicionales sobre la compra"
                  multiline
                  numberOfLines={3}
                  value={notas}
                  onChangeText={setNotas}
                />

                <TouchableOpacity
                  style={[
                    commonStyles.submitOrderButton,
                    loading && commonStyles.submitOrderButtonDisabled,
                  ]}
                  onPress={handleSaveCompra}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={commonStyles.submitOrderButtonText}>
                      {isEditing ? "Guardar Cambios" : "Registrar Compra"}
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
  compraCard: {
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
    width: 100,
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
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: COLOR.CARD_COMPONENT_BG,
    marginBottom: 10,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: COLOR.TEXT_DARK,
    fontFamily: "Lato",
  },
  notesInput: {
    height: 100,
    textAlignVertical: "top",
  },
  createButton: {
    marginTop: 5,
    marginBottom: 15,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLOR.ORANGE,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default AdminPurchaseRegisterScreen;
