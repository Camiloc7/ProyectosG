export type UserRole =
  | "ADMIN"
  | "MESERO"
  | "COCINERO"
  | "SUPERVISOR"
  | "UNKNOWN";
export interface Role {
  id: string;
  nombre: UserRole;
}
export interface AuthTokenPayload {
  id: string;
  username: string;
  rol_id: string;
  rol: UserRole;
  establecimiento_id: string;
  iat: number;
  exp: number;
  nombre_establecimiento: string;
}
export interface LoginResponse {
  access_token: string;
}
export interface AuthUser {
  id: string;
  username: string;
  rol: string;
  establecimiento_id: string;
  nombre_establecimiento: string;
}
