import express, { Router } from "express";
import {
  uploadProductImage,
  upload,
  deleteImage,
} from "../controllers/subidaDeArchivos/subidaDeImagenes";
import { validateTokenMiddleware } from "../middlewares/validateToken";

const router = Router();

router.post(
  "/planeacion/pdf",
  validateTokenMiddleware,
  upload.single("file"),
  uploadProductImage
);

router.post("/delete-image/", validateTokenMiddleware, deleteImage);
export default router;
