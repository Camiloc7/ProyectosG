import { Request, Response, NextFunction } from "express";

export const validateContentType = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const allowed = ["application/json", "multipart/form-data"];
  const contentType = req.headers["content-type"] || "";

  if (!allowed.some((type) => contentType.includes(type))) {
    res.status(415).json({ message: "Tipo de contenido no permitido" });
    return;
  }

  next();
};
