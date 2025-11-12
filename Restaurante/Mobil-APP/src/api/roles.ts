import { API_BASE_URL } from "./config";
import { Role } from "../types/auth";

export async function fetchRoles(): Promise<Role[]> {
  const response = await fetch(`${API_BASE_URL}/roles`);

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Error desconocido" }));
    throw new Error(errorData.message || "Error al obtener roles");
  }
  const responseData = await response.json();
  if (responseData && Array.isArray(responseData.data)) {
    return responseData.data;
  } else {
    console.error("Formato de respuesta de roles inesperado:", responseData);
    throw new Error(
      "La respuesta de la API de roles no tiene el formato esperado."
    );
  }
}
