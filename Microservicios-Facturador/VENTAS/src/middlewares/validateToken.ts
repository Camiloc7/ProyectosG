import jwt, { JwtPayload, Algorithm } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();

const tokenKey = process.env.SECRET_KEY;
if (!tokenKey) {
  throw new Error("La SECRET_KEY no está definida en la configuración.");
}
const tokenKeyString: string = tokenKey; // Aseguramos a TypeScript que es un string

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
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, tokenKeyString, {
      algorithms: [tokenAlgorithm],
    }) as JwtPayload;

    // Asigna el payload decodificado a req.user para utilizarlo más adelante
    (req as any).user = decoded;

    // Adjunta el token original a res.locals para ser utilizado en otras funciones
    res.locals.token = token;

    return next();
  } catch (error) {
    console.error("Error en la validación del token:", error);
    res
      .status(401)
      .json({ status: false, message: "Token inválido o expirado." });
    return;
  }
}
