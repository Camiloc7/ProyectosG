import { JwtPayload } from "jsonwebtoken";

declare module "express-serve-static-core" {
  interface Request {
    user?: string | JwtPayload;
  }
}

export {};

export interface TokenInfo {
  nombre_usuario: string;
  id_empresa: string;
  nit: string;
  dv: string | null;
  constructor: string;
  rol: string;
  API_TIME: number;
}

export interface MyJwtPayload extends JwtPayload {
  id_empresa: number;
  nombre_usuario: string;
}
