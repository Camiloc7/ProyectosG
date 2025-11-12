import { Router } from "express";
import { validateTokenMiddleware } from "../middlewares/validateToken";
import {
  getRetenciones,
  getUnidadesDeMedida,
} from "../controllers/datosExtra/unidadesDeMedida";
import { getCategoriaSelect } from "../controllers/ventas/categorias";

const router = Router();

router.get("/unidadesDeMedida", validateTokenMiddleware, getUnidadesDeMedida);
router.get("/retenciones", validateTokenMiddleware, getRetenciones);
router.get("/select5-8", getCategoriaSelect);

export default router;
