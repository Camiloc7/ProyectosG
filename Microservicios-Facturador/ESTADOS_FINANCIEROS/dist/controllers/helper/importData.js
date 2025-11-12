"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importAll = void 0;
const database_1 = require("../../config/database");
const csv_1 = require("./csv"); // extrae esta función de tus controladores
const Seccion_models_1 = __importDefault(require("../../models/Seccion.models"));
const Descripcion_models_1 = __importDefault(require("../../models/Descripcion.models"));
const Items_models_1 = __importDefault(require("../../models/Items.models"));
const path_1 = __importDefault(require("path"));
const CSV_FILE_PATH = path_1.default.resolve(__dirname, "../../data/SECCIONES-SG-SST.csv");
// Funciones de servicio PURAS (devuelven arrays, no hacen res.json)
async function buildData() {
    const rows = (0, csv_1.parseCSVRows)(CSV_FILE_PATH);
    // 1) Secciones
    const seccionMap = new Map();
    rows.forEach((row) => {
        const nombre = row.SECCION ?? "";
        if (!seccionMap.has(nombre)) {
            seccionMap.set(nombre, {
                id: seccionMap.size + 1,
                nombre,
                ciclo: row.CICLO ?? "",
            });
        }
    });
    const secciones = Array.from(seccionMap.values());
    // 2) Descripciones
    const descripcionMap = new Map();
    rows.forEach((row) => {
        const key = row.DESCRIPCIONES ?? "";
        if (!descripcionMap.has(key)) {
            const seccionInfo = seccionMap.get(row.SECCION ?? "");
            descripcionMap.set(key, {
                id: descripcionMap.size + 1,
                descripcion: key,
                pesoPorcentual: Number(row.PESOPORCENTUAL) || 0,
                seccionID: seccionInfo.id,
                calificacionSeccion: Number(row.CALIFICACIONSECCION) || 0,
            });
        }
    });
    const descripciones = Array.from(descripcionMap.values());
    // 3) Items
    const itemMap = new Map();
    const prefixRegex = /^(\d+\.\d+\.\d+)\.?\s*(.*)$/;
    rows.forEach((row) => {
        const raw = row.ITEMDELESTANDAR ?? "";
        if (!itemMap.has(raw)) {
            const match = raw.match(prefixRegex);
            const codigo = match?.[1] ?? null;
            const actividad = match?.[2] ?? raw;
            const descInfo = descripcionMap.get(row.DESCRIPCIONES ?? "");
            itemMap.set(raw, {
                id: itemMap.size + 1,
                descripcionID: descInfo.id,
                valorItemEstandar: Number(row.VALORDELITEMDELESTANDAR) || 0,
                actividad,
                codigo,
            });
        }
    });
    const items = Array.from(itemMap.values());
    return { secciones, descripciones, items };
}
// Controlador principal
const importAll = async (req, res) => {
    const transaction = await database_1.sequelize.transaction();
    try {
        // 0) Check pre-existence
        const existing = await Seccion_models_1.default.count({ transaction });
        if (existing > 0) {
            await transaction.rollback();
            return res.status(409).json({
                success: false,
                message: "Los datos ya fueron importados anteriormente.",
            });
        }
        // 1) Construir datos
        const { secciones, descripciones, items } = await buildData();
        // 2) Insertar en orden
        await Seccion_models_1.default.bulkCreate(secciones, { transaction });
        await Descripcion_models_1.default.bulkCreate(descripciones, { transaction });
        await Items_models_1.default.bulkCreate(items, { transaction });
        // 3) Confirmar
        await transaction.commit();
        return res.status(200).json({
            success: true,
            message: "Importación completada correctamente.",
            counts: {
                secciones: secciones.length,
                descripciones: descripciones.length,
                items: items.length,
            },
        });
    }
    catch (error) {
        await transaction.rollback();
        console.error("Import error:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
exports.importAll = importAll;
