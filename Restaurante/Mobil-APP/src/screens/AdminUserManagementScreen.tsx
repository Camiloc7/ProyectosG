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
  Pressable,
  Platform,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { AuthContext } from "../context/AuthContext";
import {
  fetchUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from "../api/usuarios";
import { fetchRoles } from "../api/roles";
import Icon from "react-native-vector-icons/FontAwesome";
import { Usuario } from "../types/models";
import { styles as commonStyles } from "../styles/commonStyles";
import { COLOR } from "../constants/colors";
import { Role } from "../types/auth";
import { COLOR_TEXT_DARK } from "./CreateProductScreen";

interface CreateUsuarioDto {
  establecimientoName: string;
  rolName: string;
  nombre: string;
  apellido: string;
  username: string;
  password: string;
  activo?: boolean;
}

interface UpdateUsuarioDto {
  nombre?: string;
  apellido?: string;
  username?: string;
  password_nueva?: string;
  rolName?: string;
  activo?: boolean;
}

function AdminUserManagementScreen() {
  const authContext = useContext(AuthContext);
  if (!authContext)
    throw new Error("AuthContext must be used within an AuthProvider");
  const { userToken, user } = authContext;

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [formValues, setFormValues] = useState<
    CreateUsuarioDto | UpdateUsuarioDto
  >({
    nombre: "",
    apellido: "",
    username: "",
    rolName: "",
  });

  const loadData = useCallback(async () => {
    if (!userToken || !user) return;
    try {
      setLoading(true);
      // Solo se obtienen usuarios del establecimiento del ADMIN
      const fetchedUsuarios = await fetchUsuarios(
        userToken,
        user.establecimiento_id
      );
      const fetchedRoles = await fetchRoles();

      setUsuarios(fetchedUsuarios);
      setRoles(fetchedRoles);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      Alert.alert(
        "Error",
        "No se pudieron cargar los datos. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCreateOrUpdate = async () => {
    if (!userToken || !user) return;

    try {
      if (isEditMode && currentUserId) {
        // Actualizar usuario
        await updateUsuario(currentUserId, formValues, userToken);
        Alert.alert("Éxito", "Usuario actualizado correctamente.");
      } else {
        // Crear usuario
        const createDto: CreateUsuarioDto = {
          ...(formValues as CreateUsuarioDto),
          establecimientoName: user.establecimiento_id, // Asumimos que esta info está en el token
        };
        await createUsuario(createDto, userToken);
        Alert.alert("Éxito", "Usuario creado correctamente.");
      }
      setModalVisible(false);
      // Limpiar formulario y recargar datos
      setFormValues({});
      loadData();
    } catch (error: any) {
      console.error("Error al guardar usuario:", error);
      Alert.alert("Error", error.message || "No se pudo guardar el usuario.");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!userToken) return;
    Alert.alert(
      "Confirmar Eliminación",
      "¿Estás seguro de que deseas eliminar este usuario? Esta acción es irreversible.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          onPress: async () => {
            try {
              await deleteUsuario(id, userToken);
              Alert.alert("Éxito", "Usuario eliminado correctamente.");
              loadData();
            } catch (error: any) {
              console.error("Error al eliminar usuario:", error);
              Alert.alert(
                "Error",
                error.message || "No se pudo eliminar el usuario."
              );
            }
          },
        },
      ]
    );
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setFormValues({
      nombre: "",
      apellido: "",
      username: "",
      rolName: "",
      password: "",
    });
    setModalVisible(true);
  };

  const openEditModal = (usuario: Usuario) => {
    setIsEditMode(true);
    setCurrentUserId(usuario.id);
    setFormValues({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      username: usuario.username,
      rolName: usuario.rol.nombre,
      activo: usuario.activo,
      password_nueva: "",
    });
    setModalVisible(true);
  };

  const renderUsuarioItem = ({ item }: { item: Usuario }) => (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.nameText}>
          {item.nombre} {item.apellido}
        </Text>
        <Text style={styles.infoText}>Usuario: {item.username}</Text>
        <Text style={styles.infoText}>Rol: {item.rol?.nombre || "N/A"}</Text>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <Icon name="edit" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteUser(item.id)}
        >
          <Icon name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLOR.ORANGE} />
        <Text style={commonStyles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={commonStyles.container}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            marginBottom: 20,
            marginTop: 10,
          }}
        >
          {/* <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 5,
            }}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color={COLOR_TEXT_DARK} />
            <Text
              style={{
                marginLeft: 10,
                fontSize: 18,
                color: COLOR_TEXT_DARK,
                fontFamily: "Lato",
              }}
            >
              Volver
            </Text>
          </TouchableOpacity> */}
          <Text style={commonStyles.title}>Crear Producto</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={commonStyles.header}>
          <Text style={commonStyles.title}>Gestión de Usuarios</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Icon name="plus" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Nuevo</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={usuarios}
          keyExtractor={(item) => item.id}
          renderItem={renderUsuarioItem}
          contentContainerStyle={styles.flatListContent}
          ListEmptyComponent={
            <View style={commonStyles.emptyListContainer}>
              <Icon
                name="users"
                size={50}
                color={COLOR.TEXT_MUTED}
                style={commonStyles.emptyListIcon}
              />
              <Text style={commonStyles.emptyListText}>
                No hay usuarios para mostrar.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
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
          <View style={styles.modalView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isEditMode ? "Editar Usuario" : "Crear Usuario"}
              </Text>
              <ScrollView style={{ width: "100%" }}>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  value={formValues.nombre}
                  onChangeText={(text) =>
                    setFormValues({ ...formValues, nombre: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Apellido"
                  value={formValues.apellido}
                  onChangeText={(text) =>
                    setFormValues({ ...formValues, apellido: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre de Usuario"
                  value={formValues.username}
                  onChangeText={(text) =>
                    setFormValues({ ...formValues, username: text })
                  }
                  editable={!isEditMode}
                />
                {!isEditMode && (
                  <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    secureTextEntry={true}
                    value={(formValues as CreateUsuarioDto).password}
                    onChangeText={(text) =>
                      setFormValues({ ...formValues, password: text })
                    }
                  />
                )}
                {isEditMode && (
                  <TextInput
                    style={styles.input}
                    placeholder="Nueva Contraseña (opcional)"
                    secureTextEntry={true}
                    value={(formValues as UpdateUsuarioDto).password_nueva}
                    onChangeText={(text) =>
                      setFormValues({ ...formValues, password_nueva: text })
                    }
                  />
                )}
                {/* Selector de Roles */}
                {Platform.OS === "ios" ? (
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>Rol</Text>
                    <Picker
                      selectedValue={formValues.rolName}
                      onValueChange={(itemValue) =>
                        setFormValues({ ...formValues, rolName: itemValue })
                      }
                    >
                      {roles.map((rol) => (
                        <Picker.Item
                          key={rol.id}
                          label={rol.nombre}
                          value={rol.nombre}
                        />
                      ))}
                    </Picker>
                  </View>
                ) : (
                  <Picker
                    style={styles.pickerAndroid}
                    selectedValue={formValues.rolName}
                    onValueChange={(itemValue) =>
                      setFormValues({ ...formValues, rolName: itemValue })
                    }
                  >
                    <Picker.Item label="Selecciona un Rol" value="" />
                    {roles.map((rol) => (
                      <Picker.Item
                        key={rol.id}
                        label={rol.nombre}
                        value={rol.nombre}
                      />
                    ))}
                  </Picker>
                )}
              </ScrollView>
              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.textStyle}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleCreateOrUpdate}
                >
                  <Text style={styles.textStyle}>
                    {isEditMode ? "Guardar Cambios" : "Crear Usuario"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (tus estilos existentes)
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLOR.ORANGE,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    shadowColor: COLOR.ORANGE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  addButtonText: {
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
  card: {
    flexDirection: "row",
    backgroundColor: COLOR.CARD_COMPONENT_BG,
    borderRadius: 15,
    padding: 20,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLOR.TEXT_DARK,
    fontFamily: "Lato",
  },
  infoText: {
    fontSize: 14,
    color: COLOR.TEXT_MUTED,
    fontFamily: "Lato",
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: "row",
  },
  editButton: {
    backgroundColor: COLOR.SUCCESS,
    borderRadius: 10,
    padding: 10,
    marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: COLOR.DANGER,
    borderRadius: 10,
    padding: 10,
    marginLeft: 10,
  },
  modalView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: COLOR.TEXT_DARK,
    fontFamily: "Lato",
  },
  input: {
    height: 50,
    width: "100%",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  modalButton: {
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#9E9E9E",
  },
  saveButton: {
    backgroundColor: COLOR.ORANGE,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Lato",
    fontSize: 16,
  },
  pickerContainer: {
    width: "100%",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  pickerLabel: {
    position: "absolute",
    top: 5,
    left: 15,
    color: COLOR.TEXT_MUTED,
    fontSize: 12,
    zIndex: 1,
  },
  pickerAndroid: {
    width: "100%",
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
});

export default AdminUserManagementScreen;
