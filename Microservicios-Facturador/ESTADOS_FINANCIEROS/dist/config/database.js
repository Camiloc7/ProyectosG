"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.sequelize = new sequelize_1.Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, 
//HOLA
{
    host: process.env.DB_HOST,
    dialect: "mysql", // Especifica MySQL como base de datos
    logging: false, // Desactiva logs de SQL en consola
});
// Probar conexión
// Solo conectar si no estamos en modo de test
if (process.env.NODE_ENV !== "test") {
    exports.sequelize
        .authenticate()
        .then(() => console.log("✅ Conexión a MySQL establecida correctamente."))
        .catch((err) => console.error("❌ Error conectando a la base de datos:", err));
}
