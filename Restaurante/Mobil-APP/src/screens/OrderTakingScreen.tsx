import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/FontAwesome";
import { SafeAreaView } from "react-native-safe-area-context";

import { MeseroStackParamList } from "../types/navigation";
import { AuthContext } from "../context/AuthContext";
import { fetchCategorias } from "../api/categorias";
import { fetchProductos } from "../api/productos";
import {
  createPedido,
  fetchPedidoByMesaIdAndStatus,
  addOrUpdatePedidoItem,
  removePedidoItem,
} from "../api/pedidos";

import {
  Categoria,
  CreatePedidoDto,
  CreatePedidoItemDto,
  Pedido,
  Producto,
} from "../types/models";

import { COLOR } from "../constants/colors";
import { styles as commonStyles } from "../styles/commonStyles";

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

export enum TipoPedido {
  MESA = "MESA",
  PARA_LLEVAR = "PARA_LLEVAR",
  DOMICILIO = "DOMICILIO",
}
// ----------------------------------------

type OrderTakingScreenRouteProp = RouteProp<
  MeseroStackParamList,
  "OrderTakingScreen"
>;
type OrderTakingScreenNavigationProp = StackNavigationProp<
  MeseroStackParamList,
  "OrderTakingScreen"
>;

interface OrderTakingScreenProps {
  route: OrderTakingScreenRouteProp;
  navigation: OrderTakingScreenNavigationProp;
}

interface CartItem extends CreatePedidoItemDto {
  producto: Producto;
  id?: string;
}

function OrderTakingScreen({ route, navigation }: OrderTakingScreenProps) {
  const { mesa } = route.params;
  const authContext = useContext(AuthContext);
  if (!authContext)
    throw new Error("AuthContext must be used within an AuthProvider");
  const { userToken, user } = authContext;

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Producto[]>([]);

  const [currentPedido, setCurrentPedido] = useState<Pedido | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const establecimientoId = user?.establecimiento_id;

  useEffect(() => {
    const loadData = async () => {
      if (!userToken || !establecimientoId || !user?.id) {
        setLoading(false);
        Alert.alert(
          "Error",
          "Información de usuario o establecimiento no disponible. Por favor, inicia sesión de nuevo."
        );
        return;
      }

      try {
        setLoading(true);
        const [fetchedCategorias, fetchedProductos] = await Promise.all([
          fetchCategorias(userToken),
          fetchProductos(userToken),
        ]);

        const parsedProductos = fetchedProductos.map((p) => ({
          ...p,
          precio: parseFloat(p.precio as any),
        }));

        setCategorias(fetchedCategorias);
        setProductos(parsedProductos);

        if (fetchedCategorias.length > 0) {
          setSelectedCategory(fetchedCategorias[0].id);
        }

        const existingPedido = await fetchPedidoByMesaIdAndStatus(
          mesa.id,
          EstadoPedido.ABIERTO,
          userToken
        );
        if (existingPedido) {
          setCurrentPedido(existingPedido);
          const existingCartItems: CartItem[] = existingPedido.pedidoItems.map(
            (item) => ({
              id: item.id,
              producto_id: item.producto_id,
              cantidad: item.cantidad,
              notas_item: item.notas_item,
              producto:
                parsedProductos.find((p) => p.id === item.producto_id) ||
                item.producto,
            })
          );
          setCartItems(existingCartItems);
          Alert.alert(
            "Info",
            `Pedido existente para la Mesa ${mesa.numero} cargado.`
          );
        }
      } catch (error: any) {
        console.error("Error al cargar datos:", error.message);
        Alert.alert(
          "Error",
          error.message ||
            "No se pudieron cargar los datos iniciales o el pedido de la mesa."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userToken, user, establecimientoId, mesa.id]);

  useEffect(() => {
    if (selectedCategory) {
      const productsInCategory = productos.filter(
        (producto) =>
          producto.categoria === selectedCategory || // si categoria es id
          producto.categoria ===
            categorias.find((c) => c.id === selectedCategory)?.nombre // si es nombre
      );
      setFilteredProducts(productsInCategory);
    } else {
      setFilteredProducts(productos);
    }
  }, [selectedCategory, productos, categorias]);

  const handleAddProductToCart = (productToAdd: Producto) => {
    const existingItemIndex = cartItems.findIndex(
      (item) => item.producto_id === productToAdd.id
    );
    if (existingItemIndex > -1) {
      const updatedCartItems = [...cartItems];
      updatedCartItems[existingItemIndex].cantidad += 1;
      setCartItems(updatedCartItems);
    } else {
      setCartItems([
        ...cartItems,
        {
          producto_id: productToAdd.id,
          cantidad: 1,
          producto: productToAdd,
          notas_item: "",
        },
      ]);
    }
  };

  const handleUpdateCartItemQuantity = (
    productId: string,
    newQuantity: number
  ) => {
    if (newQuantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.producto_id === productId
          ? { ...item, cantidad: newQuantity }
          : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.producto_id !== productId)
    );
  };

  const calculateCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.cantidad * item.producto.precio,
      0
    );
  };

  const handleSubmitOrder = async () => {
    if (!userToken || !establecimientoId || !user?.id) {
      Alert.alert(
        "Error",
        "Información de usuario o establecimiento no disponible. Por favor, inicia sesión de nuevo."
      );
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert(
        "Advertencia",
        "El pedido está vacío. Añade productos antes de enviar."
      );
      return;
    }

    setSubmittingOrder(true);
    try {
      if (currentPedido) {
        for (const item of cartItems) {
          await addOrUpdatePedidoItem(
            currentPedido.id,
            {
              producto_id: item.producto_id,
              cantidad: item.cantidad,
              notas_item: item.notas_item,
            },
            userToken
          );
        }
        const originalItemIds = currentPedido.pedidoItems.map(
          (pi) => pi.producto_id
        );
        const removedItems = originalItemIds.filter(
          (id) => !cartItems.some((ci) => ci.producto_id === id)
        );
        for (const productId of removedItems) {
          const itemToRemove = currentPedido.pedidoItems.find(
            (pi) => pi.producto_id === productId
          );
          if (itemToRemove && itemToRemove.id) {
            await removePedidoItem(
              currentPedido.id,
              itemToRemove.id,
              userToken
            );
          }
        }
        Alert.alert("Éxito", `Pedido para Mesa ${mesa.numero} actualizado.`);
      } else {
        const createDto: CreatePedidoDto = {
          establecimiento_id: establecimientoId,
          mesa_id: mesa.id,
          tipo_pedido: TipoPedido.MESA,
          pedidoItems: cartItems.map((item) => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            notas_item: item.notas_item,
            tipo_producto: "SIMPLE",
          })),
        };
        const newPedido = await createPedido(createDto, userToken);
        setCurrentPedido(newPedido);
        Alert.alert("Éxito", `Nuevo pedido creado para Mesa ${mesa.numero}.`);
      }
      setReviewModalVisible(false);
      const updatedPedido = await fetchPedidoByMesaIdAndStatus(
        mesa.id,
        EstadoPedido.ABIERTO,
        userToken
      );
      if (updatedPedido) {
        setCurrentPedido(updatedPedido);
        setCartItems(
          updatedPedido.pedidoItems.map((item) => ({
            id: item.id,
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            notas_item: item.notas_item,
            producto:
              productos.find((p) => p.id === item.producto_id) || item.producto,
          }))
        );
      }
    } catch (error: any) {
      console.error("Error al enviar pedido:", error.message);
      Alert.alert("Error", error.message || "No se pudo enviar el pedido.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const renderCategoriaItem = ({ item }: { item: Categoria }) => (
    <TouchableOpacity
      style={[
        commonStyles.categoryButton,
        selectedCategory === item.id && commonStyles.selectedCategoryButton,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text
        style={[
          commonStyles.categoryButtonText,
          selectedCategory === item.id &&
            commonStyles.selectedCategoryButtonText,
        ]}
      >
        {item.nombre}
      </Text>
    </TouchableOpacity>
  );

  const renderProductoItem = ({ item }: { item: Producto }) => (
    <TouchableOpacity
      style={commonStyles.productCard}
      activeOpacity={0.8}
      onPress={() => handleAddProductToCart(item)}
    >
      <View style={commonStyles.productInfo}>
        <Text style={commonStyles.productName}>{item.nombre}</Text>
        <Text style={commonStyles.productDescription}>
          {item.descripcion || "Sin descripción"}
        </Text>
        <Text style={commonStyles.productPrice}>
          ${typeof item.precio === "number" ? item.precio.toFixed(2) : "0.00"}
        </Text>
      </View>
      <View style={commonStyles.addProductButton}>
        <Icon name="plus" size={20} color="#fff" />
      </View>
    </TouchableOpacity>
  );

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={commonStyles.cartItemCard}>
      <View style={commonStyles.cartItemDetails}>
        <Text style={commonStyles.cartItemName}>{item.producto.nombre}</Text>
        {item.notas_item ? (
          <Text style={commonStyles.cartItemNotes}>
            Notas: {item.notas_item}
          </Text>
        ) : null}
      </View>
      <View style={commonStyles.cartItemControls}>
        <TouchableOpacity
          onPress={() =>
            handleUpdateCartItemQuantity(item.producto_id, item.cantidad - 1)
          }
          style={commonStyles.quantityButton}
        >
          <Text style={commonStyles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={commonStyles.cartItemQuantity}>{item.cantidad}</Text>
        <TouchableOpacity
          onPress={() =>
            handleUpdateCartItemQuantity(item.producto_id, item.cantidad + 1)
          }
          style={commonStyles.quantityButton}
        >
          <Text style={commonStyles.quantityButtonText}>+</Text>
        </TouchableOpacity>
        <Text style={commonStyles.cartItemPrice}>
          ${(item.cantidad * item.producto.precio).toFixed(2)}
        </Text>
        <TouchableOpacity
          onPress={() => handleRemoveCartItem(item.producto_id)}
          style={commonStyles.removeCartItemButton}
        >
          <Icon name="trash" size={20} color={COLOR.RED} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLOR.ORANGE} />
        <Text style={commonStyles.loadingText}>Cargando datos...</Text>
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
          <Text style={commonStyles.title}>Pedido Mesa {mesa.numero}</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={commonStyles.subtitle}>Selecciona los productos</Text>

        <FlatList
          data={categorias}
          renderItem={renderCategoriaItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={commonStyles.categoriesListContent}
          style={commonStyles.categoriesScroll}
        />

        <FlatList
          data={filteredProducts}
          renderItem={renderProductoItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={commonStyles.productGridRow}
          contentContainerStyle={commonStyles.productsListContent}
          ListEmptyComponent={
            <View style={commonStyles.emptyListContainer}>
              <Icon
                name="frown-o"
                size={50}
                color={COLOR.TEXT_MUTED}
                style={commonStyles.emptyListIcon}
              />
              <Text style={commonStyles.emptyListText}>
                No hay productos disponibles en esta categoría.
              </Text>
            </View>
          }
        />

        <View style={commonStyles.orderSummaryContainer}>
          <Text style={commonStyles.orderSummaryText}>
            Total Pedido: ${calculateCartTotal().toFixed(2)}
          </Text>
          <TouchableOpacity
            style={commonStyles.reviewOrderButton}
            onPress={() => setReviewModalVisible(true)}
            disabled={cartItems.length === 0}
          >
            <Text style={commonStyles.reviewOrderButtonText}>
              Revisar Pedido
            </Text>
            <Icon
              name="chevron-right"
              size={16}
              color="#fff"
              style={{ marginLeft: 10 }}
            />
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={isReviewModalVisible}
          onRequestClose={() => setReviewModalVisible(false)}
        >
          <View style={commonStyles.modalOverlay}>
            <View style={commonStyles.modalContent}>
              <Text style={commonStyles.modalTitle}>
                Revisar Pedido - Mesa {mesa.numero}
              </Text>
              <FlatList
                data={cartItems}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.producto_id + (item.id || "")}
                contentContainerStyle={commonStyles.modalCartList}
                ListEmptyComponent={
                  <Text style={commonStyles.emptyListText}>
                    El carrito está vacío.
                  </Text>
                }
              />
              <View style={commonStyles.modalSummary}>
                <Text style={commonStyles.modalTotalText}>
                  Total: ${calculateCartTotal().toFixed(2)}
                </Text>
                <TouchableOpacity
                  style={[
                    commonStyles.submitOrderButton,
                    submittingOrder && commonStyles.submitOrderButtonDisabled,
                  ]}
                  onPress={handleSubmitOrder}
                  disabled={submittingOrder || cartItems.length === 0}
                >
                  {submittingOrder ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={commonStyles.submitOrderButtonText}>
                      Enviar Pedido
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={commonStyles.modalCloseButton}
                  onPress={() => setReviewModalVisible(false)}
                >
                  <Text style={commonStyles.modalCloseButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
export default OrderTakingScreen;
