import { body, validationResult } from "express-validator";

export const validateItemDeVenta = [
  body("descripcion")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("La descripción es obligatoria."),
  body("subtotal")
    .isDecimal()
    .withMessage("El subtotal debe ser un valor decimal."),
  body("unidadDeMedida")
    .isInt({ gt: 0 })
    .withMessage("El código de unidad de medida debe ser un entero positivo."),
  body("porcentajeIva")
    .isFloat({ min: 0 })
    .withMessage("El porcentaje de IVA debe ser un número positivo."),
  body("iva").isDecimal().withMessage("El IVA debe ser un valor decimal."),
  body("total").isDecimal().withMessage("El total debe ser un valor decimal."),
  body("retefuente")
    .optional()
    .isDecimal()
    .withMessage("La retefuente debe ser un valor decimal."),
  body("reteica")
    .optional()
    .isDecimal()
    .withMessage("La reteica debe ser un valor decimal."),
  body("urlImagen")
    .optional()
    .isURL()
    .withMessage("La URL de la imagen debe ser una URL válida."),
  body("descuentoVenta")
    .optional()
    .isDecimal()
    .withMessage("El descuento debe ser un valor decimal."),
  body("idCategoria")
    .isInt({ gt: 0 })
    .withMessage("El idCategoria debe ser un entero positivo."),
];
