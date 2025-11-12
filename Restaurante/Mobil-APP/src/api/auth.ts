import { API_BASE_URL } from "./config";
import { LoginResponse } from "../types/auth";
interface AuthApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}
export async function loginUser(
  username: string,
  password: string
): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al iniciar sesión");
    }
    const responseBody: AuthApiResponse<LoginResponse> = await response.json();
    if (responseBody && responseBody.data && responseBody.data.access_token) {
      return responseBody.data;
    } else {
      throw new Error(
        "Formato de respuesta de login inesperado: no se encontró el token de acceso."
      );
    }
  } catch (error: any) {
    console.error("Error en loginUser:", error.message);
    throw error;
  }
}
