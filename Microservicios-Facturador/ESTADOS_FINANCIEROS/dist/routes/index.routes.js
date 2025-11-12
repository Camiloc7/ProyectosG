"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_routes_1 = __importDefault(require("../routes/upload.routes"));
const planeacion_routes_1 = __importDefault(require("../routes/planeacion.routes"));
const helpers_routes_1 = __importDefault(require("../routes/helpers.routes"));
const router = (0, express_1.Router)();
router.use("/planeacion", planeacion_routes_1.default);
router.use("/upload", upload_routes_1.default);
router.use("/csv", helpers_routes_1.default);
exports.default = router;
