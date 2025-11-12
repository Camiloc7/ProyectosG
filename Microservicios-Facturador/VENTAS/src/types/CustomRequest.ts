import { Request } from "express";
import { TokenInfo } from "../types/types";

export interface CustomRequest extends Request {
  user: TokenInfo;
}
