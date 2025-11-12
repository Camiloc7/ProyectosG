import { Router } from "express";
import uploadRoutes from "./upload.routes";
import planeacionRoutes from "./planeacion.routes";
import helpersRoutes from "./helpers.routes";
import s3Proxy from "./s3Proxy.routes";

const router = Router();

router.use("/planeacion", planeacionRoutes);
router.use("/upload", uploadRoutes);
router.use("/proxy", s3Proxy);
router.use("/csv", helpersRoutes);

export default router;
