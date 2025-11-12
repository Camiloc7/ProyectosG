"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const index_routes_1 = __importDefault(require("./routes/index.routes"));
const models_1 = require("./models");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 3000;
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(index_routes_1.default);
models_1.sequelize
    .sync({ force: false })
    .then(() => {
    console.log("Las tablas han sido sincronizadas correctamente.");
})
    .catch((err) => {
    console.error("Error sincronizando las tablas:", err);
});
const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    // console.log(`Base de de datos http://127.0.0.1/phpmyadmin`);
});
exports.server = server;
