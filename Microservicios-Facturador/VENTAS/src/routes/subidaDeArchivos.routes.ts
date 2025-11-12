import express from "express";
import {
  uploadProductImage,
  upload,
} from "../controllers/subidaDeArchivos/subidaDeImagenes";

const router = express.Router();

router.post("/upload-image", upload.single("image"), uploadProductImage);

export default router;
