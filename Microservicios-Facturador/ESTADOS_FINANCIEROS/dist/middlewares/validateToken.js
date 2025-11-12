"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTokenMiddleware = validateTokenMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const tokenKeyString = process.env.SECRET_KEY;
const tokenAlgorithm = process.env.ALGORITHM || "HS256";
function validateTokenMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({
            status: false,
            message: "Header de autorización no encontrado.",
        });
        return;
    }
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        res.status(401).json({
            status: false,
            message: "Formato de token inválido.",
        });
    }
    const token = parts[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, tokenKeyString, {
            algorithms: [tokenAlgorithm],
        });
        // console.log("Decoded JWT:", decoded);
        req.user = decoded;
        res.locals.token = token;
        next();
    }
    catch (error) {
        console.error("Error en la validación del token:", error);
        res
            .status(401)
            .json({ status: false, message: "Token inválido o expirado." });
    }
}
