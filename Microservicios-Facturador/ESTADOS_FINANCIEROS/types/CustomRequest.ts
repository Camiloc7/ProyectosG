import { Request } from "express";
import { TokenInfo } from "./types";

export interface CustomRequest extends Request {
  user: TokenInfo;
}
