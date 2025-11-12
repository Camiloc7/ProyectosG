import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { fetchEstablecimientoById } from "../api/establecimientos";
import { Establecimiento } from "../types/models";
import { Ionicons } from "@expo/vector-icons";
import { COLOR } from "../constants/colors";

export default function TopBar() {
  const authContext = useContext(AuthContext);
  if (!authContext) return null;

  const { userToken, user, signOut } = authContext;
  const [establecimientoActual, setEstablecimientoActual] =
    useState<Establecimiento | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const getEstablecimiento = async () => {
    if (!user?.establecimiento_id || !userToken) return;
    const establecimiento = await fetchEstablecimientoById(
      user?.establecimiento_id,
      userToken
    );
    setEstablecimientoActual(establecimiento);
  };

  useEffect(() => {
    getEstablecimiento();
  }, []);

  const toggleMenu = () => setMenuVisible(!menuVisible);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.userName}>{user?.username || "Usuario"}</Text>
        <Text style={styles.establecimiento}>
          {establecimientoActual?.nombre || "Establecimiento Desconocido"}
        </Text>
      </View>
      {/* Avatar circular */}
      <TouchableOpacity onPress={toggleMenu}>
        {establecimientoActual?.logo_url ? (
          <Image
            source={{ uri: establecimientoActual.logo_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={22} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {/* Dropdown pegado al avatar */}
      <Modal transparent visible={menuVisible} onRequestClose={toggleMenu}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleMenu}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menu}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  toggleMenu();
                  signOut();
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#1E293B" />
                <Text style={styles.menuText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  left: {
    flexDirection: "column",
  },
  establecimiento: {
    fontSize: 18,
    fontWeight: "700",
    color: COLOR.TEXT_DARK,
  },
  userName: {
    fontSize: 14,
    color: COLOR.TEXT_MUTED,
    fontWeight: "500",
  },

  container: {
    backgroundColor: COLOR.CARD_COMPONENT_BG,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
  },
  titleGastro: {
    color: COLOR.TEXT_DARK,
    fontSize: 20,
    fontWeight: "700",
  },
  // userName: {
  //   color: COLOR.TEXT_DARK,
  //   fontSize: 16,
  //   fontWeight: "600",
  // },
  // establecimiento: {
  //   color: COLOR.TEXT_MUTED,

  //   // color: "#cbd5e1",
  //   fontSize: 14,
  // },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#334155",
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
  },
  menuContainer: {
    position: "absolute",
    top: 60, // justo debajo del TopBar
    right: 16, // alineado al avatar
  },
  menu: {
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 6,
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  menuText: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },
});
