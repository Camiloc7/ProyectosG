import { MyJwtPayload } from "./types";

declare global {
  namespace Express {
    interface Request {
      user?: MyJwtPayload;
    }
  }
}
