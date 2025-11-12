import { Router } from "express";
import { validateTokenMiddleware } from "../middlewares/validateToken";
import {
  createPdf,
  // deletePDF,
  getListaPlanear,
  getPdfById,
  // getPDFInfo,
  // postPDF,
} from "../controllers/planeacion/pdf";
import { asyncHandler } from "../utils/asyncHandler";
import { create } from "domain";
import { createOrUpdate } from "../controllers/planeacion/itemsUsuarios";
// import { validateTokenMiddlewareViaCookie } from "../middlewares/validateCookies";

const multer = require("multer");

const router = Router();

router.get("/pdf/:itemID", validateTokenMiddleware, asyncHandler(getPdfById));
// router.post("/get-pdf", validateTokenMiddleware, asyncHandler(getPDFInfo));
router.get("/lista", validateTokenMiddleware, asyncHandler(getListaPlanear));
router.post("/pdf", validateTokenMiddleware, asyncHandler(createPdf));
// router.delete("/pdf", validateTokenMiddleware, asyncHandler(deletePDF));
router.post(
  "/item-usuario",
  validateTokenMiddleware,
  asyncHandler(createOrUpdate)
);

export default router;
