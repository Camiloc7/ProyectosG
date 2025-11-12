import { Router } from "express";
import { validateTokenMiddleware } from "../middlewares/validateToken";
import {
  getCategoriaName,
  getCategoriasEmpresa,
  getCategoriasProductoSegunCiuu,
} from "../controllers/ventas/categorias";
import {
  deleteItemDeVenta,
  getItemById,
  getItemsListByEmpresa,
  getProximoCodigo,
  postItemDeVenta,
  putEditItemDeVenta,
} from "../controllers/ventas/items";
const multer = require("multer");
const upload = multer();

const router = Router();

router.get("/empresa", validateTokenMiddleware, getCategoriasEmpresa);
router.get(
  "/productos",
  validateTokenMiddleware,
  getCategoriasProductoSegunCiuu
);
router.post(
  "/item",
  validateTokenMiddleware,
  upload.single("image"),
  postItemDeVenta
);

router.get("/categoria-name", validateTokenMiddleware, getCategoriaName);
router.put(
  "/item/:id",
  validateTokenMiddleware,
  upload.single("image"),
  putEditItemDeVenta
);
router.delete("/item/:id", validateTokenMiddleware, deleteItemDeVenta);
router.get("/get-item/:id", validateTokenMiddleware, getItemById);
router.get("/get-items", validateTokenMiddleware, getItemsListByEmpresa);
router.get(
  "/proximo-codigo/:idCategoriaProducto",
  validateTokenMiddleware,
  getProximoCodigo
);

export default router;
