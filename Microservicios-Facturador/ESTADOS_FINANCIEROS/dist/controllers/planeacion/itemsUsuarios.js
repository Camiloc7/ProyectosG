"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrUpdate = void 0;
const ItemsUsuarios_models_1 = __importDefault(require("../../models/ItemsUsuarios.models"));
const createOrUpdate = async (req, res) => {
    try {
        const { itemId, peso, calificacionItem, cumplimiento } = req.body;
        const { id_empresa: usuarioId } = req.user;
        // Validaciones básicas
        if (!usuarioId) {
            return res.status(401).json({
                status: false,
                message: "Usuario no autenticado.",
            });
        }
        if (!itemId) {
            return res.status(400).json({
                status: false,
                message: "El campo 'itemId' es obligatorio.",
            });
        }
        // Buscar si ya existe un registro para este usuario y item
        let itemDeUsuario = await ItemsUsuarios_models_1.default.findOne({
            where: {
                usuarioID: usuarioId,
                itemID: itemId,
            },
        });
        if (itemDeUsuario) {
            // Actualizar los campos necesarios
            itemDeUsuario.peso = peso;
            itemDeUsuario.calificacionItem = calificacionItem;
            itemDeUsuario.cumplimiento = cumplimiento;
            await itemDeUsuario.save();
            return res.status(200).json({
                status: true,
                message: "Item de usuario actualizado exitosamente.",
                data: itemDeUsuario,
            });
        }
        else {
            // Crear un nuevo registro
            const nuevoItem = await ItemsUsuarios_models_1.default.create({
                usuarioID: usuarioId,
                itemID: itemId,
                peso,
                calificacionItem,
                cumplimiento,
            });
            return res.status(201).json({
                status: true,
                message: "Item de usuario creado exitosamente.",
                data: nuevoItem,
            });
        }
    }
    catch (error) {
        console.error("Error en createOrUpdate:", error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : "Error interno desconocido.",
        });
    }
};
exports.createOrUpdate = createOrUpdate;
