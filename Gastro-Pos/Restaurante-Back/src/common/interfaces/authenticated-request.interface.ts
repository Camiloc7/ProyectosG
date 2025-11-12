import { Request } from 'express';
export interface AuthenticatedUserPayload {
  id: string;
  username: string;
  rol_id: string;
  establecimiento_id: string;
}
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUserPayload;
}