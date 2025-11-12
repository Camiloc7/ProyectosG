"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.getSignedImageUrl = exports.uploadProductImage = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const client_s3_2 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const client_s3_3 = require("@aws-sdk/client-s3");
// Configuración del cliente de S3
const s3Client = new client_s3_1.S3Client({ region: process.env.AWS_REGION });
// Configuración de multer (almacena el archivo en memoria para trabajar con él directamente)
exports.upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const uploadProductImage = async (req, res) => {
    try {
        // 1. Validaciones básicas
        const file = req.file;
        const token = res.locals.token;
        const { id_empresa: usuarioID, nit } = req.user;
        if (!usuarioID) {
            throw new Error("Usuario no autenticado.");
        }
        if (!token) {
            throw new Error("Falta token de autenticación.");
        }
        if (!file) {
            res.status(400).json({
                status: false,
                message: "No se ha enviado ningún archivo.",
            });
            return;
        }
        if (!file.mimetype.startsWith("image/")) {
            res.status(400).json({
                status: false,
                message: "El archivo no es una imagen válida.",
            });
            return;
        }
        if (!nit) {
            throw new Error("La info de usuario no contiene NIT.");
        }
        // 2. Construir el key igual que la segunda función, usando un prefijo fijo
        const uniqueTimestamp = Date.now();
        const key = `facturador/uploads/${uniqueTimestamp}_${file.originalname}`;
        // 3. Comando para subir el objeto a S3
        const command = new client_s3_1.PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        });
        await s3Client.send(command);
        // 4. Respuesta al cliente
        res.status(200).json({
            status: true,
            message: "Imagen subida correctamente",
            key: key,
        });
    }
    catch (error) {
        console.error("Error en uploadProductImage:", error);
        res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
exports.uploadProductImage = uploadProductImage;
const getSignedImageUrl = async (req, res) => {
    try {
        const { key } = req.params;
        if (!key) {
            res.status(400).json({
                status: false,
                message: "Falta el parámetro 'key'",
            });
            return;
        }
        const command = new client_s3_2.GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: key,
        });
        const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, {
            expiresIn: 3600, // 1 hora
        });
        res.status(200).json({
            status: true,
            url: signedUrl,
        });
    }
    catch (error) {
        console.error("Error al generar URL prefirmada:", error);
        res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
exports.getSignedImageUrl = getSignedImageUrl;
const deleteImage = async (req, res) => {
    try {
        const { key } = req.params;
        if (!key) {
            res.status(400).json({
                status: false,
                message: "Falta el parámetro 'key'.",
            });
            return;
        }
        // Construye el comando de eliminación
        const deleteCommand = new client_s3_3.DeleteObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: key,
        });
        // Envía el comando a S3
        await s3Client.send(deleteCommand);
        res.status(200).json({
            status: true,
            message: "Imagen eliminada correctamente.",
        });
    }
    catch (error) {
        console.error("Error al eliminar la imagen:", error);
        res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : "Error desconocido.",
        });
    }
};
exports.deleteImage = deleteImage;
exports.default = exports.upload;
