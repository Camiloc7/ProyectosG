import { body, param } from "express-validator";

export const validateCreateItem = [
  body("cantidad").isFloat({ min: 0 }),
  body("subtotal").isFloat({ min: 0 }),
  body("total").isFloat({ min: 0 }),
  body("iva").isFloat({ min: 0 }),
  body("descripcion").isString().isLength({ min: 1, max: 255 }),
  body("unidadDeMedida").isString().isLength({ min: 1, max: 100 }),
];

export const validateUUIDParam = [
  param("id").isUUID().withMessage("ID inválido"),
];
