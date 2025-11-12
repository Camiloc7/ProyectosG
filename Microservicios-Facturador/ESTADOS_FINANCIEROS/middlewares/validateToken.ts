import jwt, { JwtPayload, Algorithm } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();

const tokenKeyString = process.env.SECRET_KEY!;
const tokenAlgorithm: Algorithm =
  (process.env.ALGORITHM as Algorithm) || "HS256";

export function validateTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({
      status: false,
      message: "Header de autorización no encontrado.",
    });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({
      status: false,
      message: "Formato de token inválido.",
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, tokenKeyString, {
      algorithms: [tokenAlgorithm],
    }) as JwtPayload;
    // console.log("Decoded JWT:", decoded);

    req.user = decoded;
    res.locals.token = token;

    next();
  } catch (error) {
    console.error("Error en la validación del token:", error);
    res
      .status(401)
      .json({ status: false, message: "Token inválido o expirado." });
  }
}
