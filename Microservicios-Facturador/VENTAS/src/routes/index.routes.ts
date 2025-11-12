import { Router } from "express";
import itemVentas from "../routes/itemVentas.routes";
import datosExtraRoutes from "../routes/datosExtra.routes";
import subidaDeArchivosRoutes from "../routes/subidaDeArchivos.routes";

const router = Router();

router.use("/ventas", itemVentas);
router.use("/datos", datosExtraRoutes);
router.use("/upload", subidaDeArchivosRoutes);

export default router;
