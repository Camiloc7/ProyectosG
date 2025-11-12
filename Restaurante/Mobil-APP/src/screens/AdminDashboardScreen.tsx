import React, { useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/FontAwesome";
import { AuthContext } from "../context/AuthContext";
import { AdminStackParamList } from "../types/navigation";
import { COLOR } from "../constants/colors";
import { styles as commonStyles } from "../styles/commonStyles";
type AdminDashboardScreenNavigationProp = StackNavigationProp<
  AdminStackParamList,
  "AdminDashboard"
>;
interface AdminDashboardScreenProps {
  navigation: AdminDashboardScreenNavigationProp;
}
function AdminDashboardScreen({ navigation }: AdminDashboardScreenProps) {
  const authContext = useContext(AuthContext);
  if (!authContext)
    throw new Error("AuthContext must be used within an AuthProvider");
  const { signOut } = authContext;

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={commonStyles.container}>
        <View style={commonStyles.header}>
          <Text style={commonStyles.title}>Panel de Administración</Text>
          {/* <TouchableOpacity style={commonStyles.logoutButton} onPress={signOut}>
            <Icon name="sign-out" size={20} color="#fff" />
            <Text style={commonStyles.logoutButtonText}>Salir</Text>
          </TouchableOpacity> */}
        </View>

        <Text style={commonStyles.subtitle}>Gestiona tu establecimiento</Text>

        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.gridButton}
            onPress={() => navigation.navigate("AdminUserManagementScreen")}
          >
            <Icon name="users" size={40} color={COLOR.ORANGE} />
            <Text style={styles.gridButtonText}>Usuarios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridButton}
            onPress={() => navigation.navigate("CreateProductScreen")}
          >
            <Icon name="cubes" size={40} color={COLOR.ORANGE} />
            <Text style={styles.gridButtonText}>Productos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridButton}
            onPress={() => navigation.navigate("AdminMesaManagementScreen")}
          >
            <Icon name="table" size={40} color={COLOR.ORANGE} />
            <Text style={styles.gridButtonText}>Mesas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridButton}
            onPress={() => Alert.alert("Funcionalidad", "Ver Reportes")}
          >
            <Icon name="bar-chart" size={40} color={COLOR.ORANGE} />
            <Text style={styles.gridButtonText}>Reportes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridButton}
            onPress={() => navigation.navigate("AdminPurchaseRegisterScreen")}
          >
            <Icon name="shopping-bag" size={40} color={COLOR.ORANGE} />
            <Text style={styles.gridButtonText}>Compras</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.gridButton}
            onPress={() =>
              navigation.navigate("AdminIngredientManagementScreen")
            }
          >
            <Icon name="leaf" size={40} color={COLOR.ORANGE} />
            <Text style={styles.gridButtonText}>Ingredientes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.gridButton}
            onPress={() => Alert.alert("Funcionalidad", "Medios de Pago")}
          >
            <Icon name="credit-card" size={40} color={COLOR.ORANGE} />
            <Text style={styles.gridButtonText}>Medios de Pago</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    padding: 10,
    marginTop: 20,
  },
  gridButton: {
    backgroundColor: COLOR.CARD_COMPONENT_BG,
    borderRadius: 15,
    padding: 20,
    width: "45%",
    marginVertical: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    justifyContent: "center",
    aspectRatio: 1,
  },
  gridButtonText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: COLOR.TEXT_DARK,
    fontFamily: "Lato",
    textAlign: "center",
  },
});

export default AdminDashboardScreen;
