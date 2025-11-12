import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity, RefreshControl, SafeAreaView, Modal, TextInput, Pressable, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AuthContext } from '../context/AuthContext';
import { fetchMesas, createMesa, updateMesa, deleteMesa } from '../api/mesas';
import { Mesa } from '../types/models';
import { styles as commonStyles } from '../styles/commonStyles';
import { COLOR } from '../constants/colors';

type MesaEstado = 'LIBRE' | 'OCUPADA' | 'MANTENIMIENTO';

// DTOs actualizados. Se añade 'estado' a CreateMesaDto para que coincida con la API
interface CreateMesaDto {
  numero: string;
  capacidad: number;
  estado: MesaEstado; // 👈 Añadido
  establecimiento_id: string;
}

interface UpdateMesaDto {
  numero?: string;
  capacidad?: number;
  estado?: MesaEstado;
}

// Se crea un tipo de estado de formulario más flexible
type FormValues = {
  numero: string;
  capacidad: number;
  estado: MesaEstado;
};

function AdminMesaManagementScreen() {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error("AuthContext must be used within an AuthProvider");
  const { userToken, user } = authContext;

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentMesaId, setCurrentMesaId] = useState<string | null>(null);

  // El estado del formulario usa el nuevo tipo FormValues
  const [formValues, setFormValues] = useState<FormValues>({
    numero: '', 
    capacidad: 0,
    estado: 'LIBRE',
  });

  const loadData = useCallback(async () => {
    if (!userToken || !user) return;
    try {
      setLoading(true);
      const fetchedMesas = await fetchMesas(userToken, user.establecimiento_id);
      setMesas(fetchedMesas);
    } catch (error) {
      console.error('Error al cargar mesas:', error);
      Alert.alert('Error', 'No se pudieron cargar las mesas. Intenta de nuevo.');
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

    // Validación básica de campos
    if (!formValues.numero || formValues.capacidad <= 0) {
      Alert.alert('Error', 'El número y la capacidad de la mesa son obligatorios.');
      return;
    }

    try {
      if (isEditMode && currentMesaId) {
        // Se usa el tipo UpdateMesaDto para la actualización
        const updateDto: UpdateMesaDto = {
          numero: formValues.numero,
          capacidad: formValues.capacidad,
          estado: formValues.estado,
        };
        await updateMesa(currentMesaId, updateDto, userToken);
        Alert.alert('Éxito', 'Mesa actualizada correctamente.');
      } else {
        // Se usa el tipo CreateMesaDto para la creación
        const createDto: CreateMesaDto = {
          numero: formValues.numero,
          capacidad: formValues.capacidad,
          estado: formValues.estado,
          establecimiento_id: user.establecimiento_id,
        };
        await createMesa(createDto, userToken);
        Alert.alert('Éxito', 'Mesa creada correctamente.');
      }
      setModalVisible(false);
      setFormValues({ numero: '', capacidad: 0, estado: 'LIBRE' });
      loadData();
    } catch (error: any) {
      console.error('Error al guardar mesa:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar la mesa.');
    }
  };

  const handleDeleteMesa = async (id: string) => {
    if (!userToken) return;
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que deseas eliminar esta mesa? Esta acción es irreversible.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              await deleteMesa(id, userToken);
              Alert.alert('Éxito', 'Mesa eliminada correctamente.');
              loadData();
            } catch (error: any) {
              console.error('Error al eliminar mesa:', error);
              Alert.alert('Error', error.message || 'No se pudo eliminar la mesa.');
            }
          },
        },
      ]
    );
  };
  
  const openCreateModal = () => {
    setIsEditMode(false);
    setFormValues({
      numero: '', 
      capacidad: 0,
      estado: 'LIBRE',
    });
    setModalVisible(true);
  };

  const openEditModal = (mesa: Mesa) => {
    setIsEditMode(true);
    setCurrentMesaId(mesa.id);
    setFormValues({
      numero: mesa.numero,
      capacidad: mesa.capacidad,
      estado: mesa.estado,
    });
    setModalVisible(true);
  };

  const getStatusColor = (estado: MesaEstado) => {
    switch (estado) {
      case 'LIBRE':
        return COLOR.SUCCESS;
      case 'OCUPADA':
        return COLOR.RED;
      case 'MANTENIMIENTO':
        return COLOR.WARNING;
      default:
        return COLOR.TEXT_MUTED;
    }
  };

  const renderMesaItem = ({ item }: { item: Mesa }) => (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.nameText}>Mesa #{item.numero}</Text>
        <Text style={styles.infoText}>Capacidad: {item.capacidad} personas</Text>
        <Text style={[styles.infoText, { color: getStatusColor(item.estado) }]}>Estado: {item.estado}</Text>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
          <Icon name="edit" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteMesa(item.id)}>
          <Icon name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
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
        <View style={commonStyles.header}>
          <Text style={commonStyles.title}>Gestión de Mesas</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Icon name="plus" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Nueva</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={mesas}
          keyExtractor={(item) => item.id}
          renderItem={renderMesaItem}
          contentContainerStyle={styles.flatListContent}
          ListEmptyComponent={
            <View style={commonStyles.emptyListContainer}>
              <Icon name="table" size={50} color={COLOR.TEXT_MUTED} style={commonStyles.emptyListIcon} />
              <Text style={commonStyles.emptyListText}>No hay mesas para mostrar.</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLOR.ORANGE} />}
        />
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{isEditMode ? 'Editar Mesa' : 'Crear Mesa'}</Text>
              <ScrollView style={{ width: '100%' }}>
                <TextInput
                  style={styles.input}
                  placeholder="Número de Mesa"
                  keyboardType="default"
                  value={formValues.numero}
                  onChangeText={(text) => setFormValues({ ...formValues, numero: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Capacidad"
                  keyboardType="numeric"
                  value={formValues.capacidad > 0 ? String(formValues.capacidad) : ''}
                  onChangeText={(text) => setFormValues({ ...formValues, capacidad: Number(text) })}
                />
                {/* Se eliminó la doble validación, ya que 'estado' siempre existe en FormValues */}
                {isEditMode && (
                  <>
                    <Text style={styles.pickerLabel}>Estado de la mesa</Text>
                    <Picker
                      selectedValue={formValues.estado}
                      onValueChange={(itemValue) => setFormValues({ ...formValues, estado: itemValue })}
                      style={styles.pickerAndroid}
                    >
                      <Picker.Item label="Libre" value="LIBRE" />
                      <Picker.Item label="Ocupada" value="OCUPADA" />
                      <Picker.Item label="Mantenimiento" value="MANTENIMIENTO" />
                    </Picker>
                  </>
                )}
              </ScrollView>
              <View style={styles.buttonContainer}>
                <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.textStyle}>Cancelar</Text>
                </Pressable>
                <Pressable style={[styles.modalButton, styles.saveButton]} onPress={handleCreateOrUpdate}>
                  <Text style={styles.textStyle}>{isEditMode ? 'Guardar Cambios' : 'Crear Mesa'}</Text>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
    fontFamily: 'Lato',
  },
  flatListContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLOR.CARD_COMPONENT_BG,
    borderRadius: 15,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLOR.TEXT_DARK,
    fontFamily: 'Lato',
  },
  infoText: {
    fontSize: 14,
    color: COLOR.TEXT_MUTED,
    fontFamily: 'Lato',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLOR.TEXT_DARK,
    fontFamily: 'Lato',
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
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
    backgroundColor: '#9E9E9E',
  },
  saveButton: {
    backgroundColor: COLOR.ORANGE,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Lato',
    fontSize: 16,
  },
  pickerLabel: {
    fontSize: 14,
    color: COLOR.TEXT_MUTED,
    marginBottom: 5,
    marginTop: 10,
  },
  pickerAndroid: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
});

export default AdminMesaManagementScreen;