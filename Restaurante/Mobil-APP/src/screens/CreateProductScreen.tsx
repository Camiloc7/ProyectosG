import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/FontAwesome";
import { Picker } from "@react-native-picker/picker";

import { AuthContext } from "../context/AuthContext";
import { AdminStackParamList } from "../types/navigation";
import {
  Categoria,
  Ingrediente,
  RecetaItem,
  Establecimiento,
} from "../types/models";
import { fetchCategorias } from "../api/categorias";
import { createProducto } from "../api/productos";
import { fetchIngredientes } from "../api/ingredientes";
import { fetchEstablecimientos } from "../api/establecimientos";

type CreateProductScreenNavigationProp = StackNavigationProp<
  AdminStackParamList,
  "CreateProductScreen"
>;

interface CreateProductScreenProps {
  navigation: CreateProductScreenNavigationProp;
}

// Colores definidos
const COLOR_BACKGROUND = "#e8eaec";
const COLOR_CARD_COMPONENT_BG = "#ffffff";
const COLOR_ORANGE = "#ed4e05";
export const COLOR_TEXT_DARK = "#263238";
const COLOR_TEXT_MUTED = "#607d8b";
const COLOR_INPUT_BG = "#f5f5f5";

function CreateProductScreen({ navigation }: CreateProductScreenProps) {
  const authContext = useContext(AuthContext);
  if (!authContext)
    throw new Error("AuthContext must be used within an AuthProvider");
  const { userToken, user } = authContext;

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [activo, setActivo] = useState(true);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState<
    Ingrediente[]
  >([]);
  const [recetaItems, setRecetaItems] = useState<RecetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentEstablecimientoId, setCurrentEstablecimientoId] =
    useState<string>("");
  const [establecimientos, setEstablecimientos] = useState<Establecimiento[]>(
    []
  );

  useEffect(() => {
    const loadInitialData = async () => {
      if (!userToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let fetchedEstablecimientoId: string = "";
        let allEstablecimientos: Establecimiento[] = [];

        if (user && user.establecimiento_id) {
          fetchedEstablecimientoId = user.establecimiento_id;
          setCurrentEstablecimientoId(user.establecimiento_id);
          allEstablecimientos = await fetchEstablecimientos(userToken, true);
          setEstablecimientos(allEstablecimientos);
        } else {
          allEstablecimientos = await fetchEstablecimientos(userToken, true);
          setEstablecimientos(allEstablecimientos);
          if (allEstablecimientos.length > 0) {
            fetchedEstablecimientoId = allEstablecimientos[0].id;
            setCurrentEstablecimientoId(fetchedEstablecimientoId);
            Alert.alert(
              "Info",
              "No se encontró establecimiento asociado al usuario. Seleccionando el primer establecimiento disponible."
            );
          } else {
            Alert.alert(
              "Error",
              "No hay establecimientos disponibles para crear productos."
            );
            setLoading(false);
            return;
          }
        }

        if (!fetchedEstablecimientoId) {
          Alert.alert(
            "Error",
            "No se pudo determinar el establecimiento. Por favor, contacta al soporte."
          );
          setLoading(false);
          return;
        }

        const [fetchedCategorias, fetchedIngredientes] = await Promise.all([
          fetchCategorias(userToken),
          fetchIngredientes(userToken),
        ]);

        setCategorias(fetchedCategorias);
        setIngredientesDisponibles(fetchedIngredientes);

        // Set default category only if categories are available
        if (fetchedCategorias.length > 0) {
          setSelectedCategoriaId(fetchedCategorias[0].id);
        } else {
          setSelectedCategoriaId(""); // Ensure it's empty string if no categories
        }
      } catch (error: any) {
        console.error("Error al cargar datos iniciales:", error.message);
        Alert.alert(
          "Error",
          error.message ||
            "No se pudieron cargar las categorías, ingredientes o establecimientos."
        );
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [userToken, user]);

  const handleAddRecetaItem = (ingrediente: Ingrediente) => {
    if (recetaItems.some((item) => item.ingrediente_id === ingrediente.id)) {
      Alert.alert(
        "Advertencia",
        "Este ingrediente ya ha sido añadido a la receta."
      );
      return;
    }
    setRecetaItems([
      ...recetaItems,
      { ingrediente_id: ingrediente.id, cantidad_necesaria: 1 },
    ]);
  };

  const handleUpdateRecetaItemQuantity = (
    ingredienteId: string,
    quantity: string
  ) => {
    const parsedQuantity = parseFloat(quantity);
    setRecetaItems((prevItems) =>
      prevItems.map((item) =>
        item.ingrediente_id === ingredienteId
          ? {
              ...item,
              cantidad_necesaria: isNaN(parsedQuantity) ? 0 : parsedQuantity,
            }
          : item
      )
    );
  };

  const handleRemoveRecetaItem = (ingredienteId: string) => {
    setRecetaItems((prevItems) =>
      prevItems.filter((item) => item.ingrediente_id !== ingredienteId)
    );
  };

  const handleCreateProduct = async () => {
    if (
      !nombre ||
      !precio ||
      !selectedCategoriaId ||
      !currentEstablecimientoId
    ) {
      Alert.alert(
        "Error",
        "Por favor, completa todos los campos obligatorios (Nombre, Precio, Categoría) y asegúrate de que el establecimiento esté seleccionado."
      );
      return;
    }

    if (!userToken) {
      Alert.alert(
        "Error",
        "No hay token de usuario. Por favor, inicia sesión de nuevo."
      );
      return;
    }

    const parsedPrecio = parseFloat(precio);
    if (isNaN(parsedPrecio) || parsedPrecio <= 0) {
      Alert.alert(
        "Error",
        "El precio debe ser un número válido mayor que cero."
      );
      return;
    }

    for (const item of recetaItems) {
      if (isNaN(item.cantidad_necesaria) || item.cantidad_necesaria <= 0) {
        Alert.alert(
          "Error",
          `La cantidad necesaria para un ingrediente de la receta no es válida: ${item.cantidad_necesaria}`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const newProduct = await createProducto(
        {
          establecimiento_id: currentEstablecimientoId,
          categoria_id: selectedCategoriaId,
          nombre,
          descripcion: descripcion || undefined,
          precio: parsedPrecio,
          imagen_url: imagenUrl || undefined,
          activo,
          receta: recetaItems.length > 0 ? recetaItems : undefined,
        },
        userToken
      );
      Alert.alert(
        "Éxito",
        `Producto "${newProduct.nombre}" creado exitosamente.`
      );
      navigation.goBack();
    } catch (error: any) {
      console.error("Error al crear producto:", error.message);
      Alert.alert("Error", error.message || "No se pudo crear el producto.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderRecetaItem = ({ item }: { item: RecetaItem }) => {
    const ingrediente = ingredientesDisponibles.find(
      (ing) => ing.id === item.ingrediente_id
    );
    if (!ingrediente) return null;

    return (
      <View style={styles.recetaItemCard}>
        <Text style={styles.recetaItemName}>{ingrediente.nombre}</Text>
        <TextInput
          style={styles.recetaItemInput}
          value={item.cantidad_necesaria.toString()}
          onChangeText={(text) =>
            handleUpdateRecetaItemQuantity(item.ingrediente_id, text)
          }
          keyboardType="numeric"
        />
        <Text style={styles.recetaItemUnit}>{ingrediente.unidad_medida}</Text>
        <TouchableOpacity
          onPress={() => handleRemoveRecetaItem(item.ingrediente_id)}
          style={styles.removeRecetaItemButton}
        >
          <Icon name="times-circle" size={20} color="#D32F2F" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLOR_ORANGE} />
        <Text style={styles.loadingText}>Cargando datos iniciales...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color={COLOR_TEXT_DARK} />
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Crear Producto</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Información General</Text>

          {/* Selector de Establecimiento (solo si el user.establecimiento_id no está en el contexto) */}
          {(!user || !user.establecimiento_id) &&
          establecimientos.length > 0 ? (
            <>
              <Text style={styles.label}>Establecimiento:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={currentEstablecimientoId}
                  onValueChange={(itemValue) =>
                    setCurrentEstablecimientoId(itemValue)
                  }
                  style={styles.picker}
                >
                  <Picker.Item
                    label="Selecciona un establecimiento..."
                    value=""
                  />
                  {establecimientos.map((est) => (
                    <Picker.Item
                      key={est.id}
                      label={est.nombre}
                      value={est.id}
                    />
                  ))}
                </Picker>
              </View>
            </>
          ) : currentEstablecimientoId ? (
            <Text style={styles.currentEstablecimientoText}>
              Establecimiento:{" "}
              {establecimientos.find((e) => e.id === currentEstablecimientoId)
                ?.nombre || "Cargando..."}
            </Text>
          ) : null}

          <Text style={styles.label}>Nombre del Producto:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Café Americano"
            placeholderTextColor="#888"
            value={nombre}
            onChangeText={setNombre}
          />

          <Text style={styles.label}>Descripción:</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ej. Delicioso café de grano arábica"
            placeholderTextColor="#888"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Precio:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. 15.99"
            placeholderTextColor="#888"
            value={precio}
            onChangeText={setPrecio}
            keyboardType="numeric"
          />

          <Text style={styles.label}>URL de Imagen (opcional):</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. http://example.com/imagen.jpg"
            placeholderTextColor="#888"
            value={imagenUrl}
            onChangeText={setImagenUrl}
            autoCapitalize="none"
          />

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Producto Activo:</Text>
            <Switch
              trackColor={{ false: "#767577", true: COLOR_ORANGE }}
              thumbColor={activo ? "#f4f3f4" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={setActivo}
              value={activo}
            />
          </View>

          <Text style={styles.label}>Categoría:</Text>
          {categorias.length > 0 ? (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCategoriaId}
                onValueChange={(itemValue) => setSelectedCategoriaId(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Selecciona una categoría..." value="" />
                {categorias.map((cat) => (
                  <Picker.Item key={cat.id} label={cat.nombre} value={cat.id} />
                ))}
              </Picker>
            </View>
          ) : (
            <Text style={styles.noCategoriesText}>
              No hay categorías disponibles. Crea una primero.
            </Text>
          )}

          {/* Sección de Receta */}
          <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
            Receta del Producto
          </Text>
          <Text style={styles.label}>Ingredientes:</Text>

          {ingredientesDisponibles.length > 0 ? (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue=""
                onValueChange={(itemValue) => {
                  if (itemValue && itemValue !== "") {
                    const selectedIngrediente = ingredientesDisponibles.find(
                      (ing) => ing.id === itemValue
                    );
                    if (selectedIngrediente) {
                      handleAddRecetaItem(selectedIngrediente);
                    }
                  }
                }}
                style={styles.picker}
              >
                <Picker.Item
                  label="Selecciona un ingrediente para añadir..."
                  value=""
                />
                {ingredientesDisponibles.map((ing) => (
                  <Picker.Item
                    key={ing.id}
                    label={`${ing.nombre} (${ing.unidad_medida})`}
                    value={ing.id}
                  />
                ))}
              </Picker>
            </View>
          ) : (
            <Text style={styles.noCategoriesText}>
              No hay ingredientes disponibles. Crea uno primero.
            </Text>
          )}

          {recetaItems.length > 0 && (
            <View style={styles.recetaListContainer}>
              <Text style={styles.recetaListTitle}>
                Ingredientes en la Receta:
              </Text>
              <FlatList
                data={recetaItems}
                renderItem={renderRecetaItem}
                keyExtractor={(item) => item.ingrediente_id}
                scrollEnabled={false}
              />
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.createButton,
              submitting && styles.createButtonDisabled,
            ]}
            onPress={handleCreateProduct}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Crear Producto</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLOR_BACKGROUND,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  backButtonText: {
    marginLeft: 10,
    fontSize: 18,
    color: COLOR_TEXT_DARK,
    fontFamily: "Lato",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLOR_TEXT_DARK,
    fontFamily: "Lato",
    flex: 1,
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: COLOR_CARD_COMPONENT_BG,
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLOR_ORANGE,
    marginBottom: 15,
    textAlign: "center",
    fontFamily: "Lato",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLOR_TEXT_DARK,
    marginBottom: 8,
    marginTop: 15,
    fontFamily: "Lato",
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#b0bec5",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: COLOR_INPUT_BG,
    fontSize: 16,
    color: COLOR_TEXT_DARK,
    fontFamily: "Lato",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 15,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 10,
  },
  pickerContainer: {
    borderColor: "#b0bec5",
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: COLOR_INPUT_BG,
    marginBottom: 10,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    height: 50,
    color: COLOR_TEXT_DARK,
  },
  pickerItem: {
    // fontFamily: 'Lato', // Comentado por problemas de compatibilidad
    // fontSize: 16,
  },
  noCategoriesText: {
    fontSize: 14,
    color: "red",
    textAlign: "center",
    marginTop: 10,
    fontFamily: "Lato",
  },
  currentEstablecimientoText: {
    fontSize: 16,
    color: COLOR_TEXT_DARK,
    textAlign: "center",
    marginBottom: 15,
    fontFamily: "Lato",
    fontWeight: "bold",
  },
  recetaListContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 15,
  },
  recetaListTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLOR_TEXT_DARK,
    marginBottom: 10,
    fontFamily: "Lato",
  },
  recetaItemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  recetaItemName: {
    flex: 2,
    fontSize: 15,
    color: COLOR_TEXT_DARK,
    fontFamily: "Lato",
  },
  recetaItemInput: {
    flex: 1,
    height: 35,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    textAlign: "center",
    fontSize: 15,
    marginHorizontal: 10,
    fontFamily: "Lato",
    backgroundColor: "#fff",
  },
  recetaItemUnit: {
    fontSize: 14,
    color: COLOR_TEXT_MUTED,
    fontFamily: "Lato",
    marginRight: 10,
  },
  removeRecetaItemButton: {
    padding: 5,
  },
  createButton: {
    backgroundColor: COLOR_ORANGE,
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 30,
    shadowColor: COLOR_ORANGE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonDisabled: {
    backgroundColor: "#f78a59",
    shadowOpacity: 0.2,
    elevation: 4,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Lato",
  },
});

export default CreateProductScreen;
