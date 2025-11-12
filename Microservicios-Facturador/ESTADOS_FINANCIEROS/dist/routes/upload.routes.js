"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subidaDeImagenes_1 = require("../controllers/subidaDeArchivos/subidaDeImagenes");
const validateToken_1 = require("../middlewares/validateToken");
const router = (0, express_1.Router)();
router.post("/planeacion/pdf", validateToken_1.validateTokenMiddleware, subidaDeImagenes_1.upload.single("file"), subidaDeImagenes_1.uploadProductImage);
router.delete("/delete-image/:key", validateToken_1.validateTokenMiddleware, subidaDeImagenes_1.deleteImage);
exports.default = router;
