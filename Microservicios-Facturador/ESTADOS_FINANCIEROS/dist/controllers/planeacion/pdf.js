"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPdfById = exports.createPdf = exports.getListaPlanear = void 0;
const PDF_models_1 = __importDefault(require("../../models/PDF.models"));
const Items_models_1 = __importDefault(require("../../models/Items.models"));
const Descripcion_models_1 = __importDefault(require("../../models/Descripcion.models"));
const Seccion_models_1 = __importDefault(require("../../models/Seccion.models"));
// import sequelize from "sequelize";
const ItemsUsuarios_models_1 = __importDefault(require("../../models/ItemsUsuarios.models"));
const SeccionPDF_1 = __importDefault(require("../../models/SeccionPDF"));
const SideData_1 = __importDefault(require("../../models/SideData"));
const ItemsPDF_1 = __importDefault(require("../../models/ItemsPDF"));
const TextData_1 = __importDefault(require("../../models/TextData"));
const FirmaData_1 = __importDefault(require("../../models/FirmaData"));
const database_1 = require("../../config/database");
const ImageData_1 = __importDefault(require("../../models/ImageData"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const client_s3_2 = require("@aws-sdk/client-s3");
// Configuración del cliente de S3
const s3Client = new client_s3_1.S3Client({ region: process.env.AWS_REGION });
const getListaPlanear = async (req, res) => {
    try {
        const { id_empresa: usuarioID } = req.user;
        if (!usuarioID)
            throw new Error("Usuario no autenticado.");
        const itemsPlanear = await Items_models_1.default.findAll({
            attributes: ["id", "actividad", "codigo", "valorItemEstandar"],
            include: [
                // 1) filtro por ciclo PLANEAR
                {
                    model: Descripcion_models_1.default,
                    as: "descripcion",
                    attributes: [],
                    include: [
                        {
                            model: Seccion_models_1.default,
                            as: "seccion",
                            attributes: [],
                            where: { ciclo: "PLANEAR" },
                        },
                    ],
                },
                // 2) inclusión de ItemsUsuarios (alias = 'usuarioItem')
                {
                    model: ItemsUsuarios_models_1.default,
                    as: "usuarioItem", // coincide con el as de hasOne
                    attributes: ["peso", "calificacionItem", "cumplimiento"],
                    where: { usuarioID },
                    required: false, // si no hay, lo devuelve null
                },
            ],
            order: [["codigo", "ASC"]],
        });
        return res.status(200).json({
            status: true,
            message: "Items del ciclo PLANEAR encontrados.",
            data: itemsPlanear, // cada item.usuarioItem === objeto | null
        });
    }
    catch (error) {
        console.error("Error al obtener items PLANEAR:", error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
exports.getListaPlanear = getListaPlanear;
const createPdf = async (req, res) => {
    const t = await database_1.sequelize.transaction();
    try {
        const { id_empresa: usuarioID } = req.user;
        if (!usuarioID)
            throw new Error("Usuario no autenticado.");
        const { titulo, versionDocumento, codigo, itemID, fechaCreacion, sections, } = req.body;
        console.log("Body", req.body);
        if (!itemID)
            throw new Error("Es necesario un id de item.");
        // Validación de posiciones únicas
        const posCheck = (arr, key, context) => {
            const positions = arr.map((el) => el[key]);
            const unique = new Set(positions);
            if (unique.size !== positions.length) {
                throw new Error(`Posiciones duplicadas en ${context}.`);
            }
        };
        sections.forEach((s) => {
            posCheck(sections, "poscicion", "secciones");
            if (s.sideData?.length)
                posCheck(s.sideData, "poscicion", `sideData sección ${s.poscicion}`);
            if (s.items?.length)
                posCheck(s.items, "poscicion", `items sección ${s.poscicion}`);
        });
        // Eliminar PDF previo y todo lo relacionado si existe
        const existing = await PDF_models_1.default.findOne({
            where: { usuarioID, itemID },
            transaction: t,
        });
        if (existing) {
            const pdfId = existing.id;
            // Fetch secciones
            const secciones = await SeccionPDF_1.default.findAll({
                where: { pdfID: pdfId },
                transaction: t,
            });
            for (const sec of secciones) {
                // Eliminar SideData
                await SideData_1.default.destroy({
                    where: { SeccionPdfID: sec.id },
                    transaction: t,
                });
                // Fetch items de la sección
                const items = await ItemsPDF_1.default.findAll({
                    where: { SeccionPdfID: sec.id },
                    transaction: t,
                });
                for (const it of items) {
                    // Eliminar datos de tipo
                    await TextData_1.default.destroy({
                        where: { itemPdfId: it.id },
                        transaction: t,
                    });
                    await FirmaData_1.default.destroy({
                        where: { itemPdfId: it.id },
                        transaction: t,
                    });
                    await ImageData_1.default.destroy({
                        where: { itemPdfId: it.id },
                        transaction: t,
                    });
                }
                // Eliminar ItemPDF
                await ItemsPDF_1.default.destroy({
                    where: { SeccionPdfID: sec.id },
                    transaction: t,
                });
            }
            // Eliminar SeccionPDF
            await SeccionPDF_1.default.destroy({ where: { pdfID: pdfId }, transaction: t });
            // Eliminar PDF
            await PDF_models_1.default.destroy({ where: { id: pdfId }, transaction: t });
        }
        // Crear PDF
        const pdf = await PDF_models_1.default.create({ titulo, versionDocumento, codigo, fechaCreacion, usuarioID, itemID }, { transaction: t });
        // Insertar secciones y subdatos
        for (const sec of sections) {
            const seccion = await SeccionPDF_1.default.create({ id: sec.id, pdfID: pdf.id, poscicion: sec.poscicion }, { transaction: t });
            if (sec.sideData?.length) {
                await SideData_1.default.bulkCreate(sec.sideData.map((sd) => ({
                    seccionPdfId: seccion.id,
                    etiqueta: sd.label,
                    contenido: sd.value,
                    poscicion: sd.poscicion,
                })), { transaction: t });
            }
            for (const it of sec.items || []) {
                const item = await ItemsPDF_1.default.create({
                    SeccionPdfID: seccion.id,
                    tipo: it.tipo,
                    poscicion: it.poscicion,
                }, { transaction: t });
                if (it.tipo === "texto") {
                    await TextData_1.default.create({
                        itemPdfId: item.id,
                        subtitulo: it.data.subtitulo,
                        contenido: it.data.contenido,
                    }, { transaction: t });
                }
                else if (it.tipo === "firma") {
                    await FirmaData_1.default.create({
                        itemPdfId: item.id,
                        nombre: it.data.nombre,
                        cargo: it.data.cargo,
                    }, { transaction: t });
                }
                else if (it.tipo === "imagen") {
                    console.log(it.data);
                    await ImageData_1.default.create({
                        itemPdfId: item.id,
                        url: it.data.urlImagen,
                        anchura: it.data.width,
                        altura: it.data.height,
                    }, { transaction: t });
                }
                else {
                    throw new Error(`Tipo desconocido: ${it.tipo}`);
                }
            }
        }
        await t.commit();
        return res.status(201).json({
            status: true,
            message: "PDF procesado correctamente",
            pdfId: pdf.id,
            pdf: pdf,
        });
    }
    catch (error) {
        await t.rollback();
        console.error("Error al procesar PDF:", error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
exports.createPdf = createPdf;
const getPdfById = async (req, res) => {
    try {
        const { id_empresa: usuarioID } = req.user;
        if (!usuarioID)
            throw new Error("Usuario no autenticado.");
        const { itemID } = req.params;
        if (!itemID) {
            return res
                .status(400)
                .json({ status: false, message: "Es necesario el id" });
        }
        const pdf = await PDF_models_1.default.findOne({
            where: { itemID, usuarioID },
            include: [
                {
                    model: SeccionPDF_1.default,
                    as: "secciones",
                    include: [
                        { model: SideData_1.default, as: "sideData" },
                        {
                            model: ItemsPDF_1.default,
                            as: "items",
                            include: [
                                { model: TextData_1.default, as: "textos" },
                                { model: FirmaData_1.default, as: "firmas" },
                                { model: ImageData_1.default, as: "imagenes" },
                            ],
                        },
                    ],
                },
            ],
            order: [[{ model: SeccionPDF_1.default, as: "secciones" }, "poscicion", "ASC"]],
        });
        if (!pdf) {
            return res.status(200).json({
                status: false,
                message: "Aún no creaste este PDF",
            });
        }
        // Recorremos secciones → items → imagenes para reemplazar key por URL pre-firmada
        if (pdf.secciones) {
            for (const seccion of pdf.secciones) {
                if (!seccion.items)
                    continue;
                for (const item of seccion.items) {
                    if (!item.imagenes)
                        continue;
                    for (const img of item.imagenes) {
                        // sólo si hay key/url original
                        if (img.url) {
                            try {
                                const cmd = new client_s3_2.GetObjectCommand({
                                    Bucket: process.env.BUCKET_NAME,
                                    Key: img.url,
                                });
                                const signed = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, cmd, {
                                    expiresIn: 3600,
                                });
                                img.url = signed;
                            }
                            catch (e) {
                                console.error(`Error generando URL prefirmada para ${img.url}:`, e);
                                // si falla, dejamos campo vacío para no romper el flujo
                                img.url = "";
                            }
                        }
                    }
                }
            }
        }
        return res
            .status(200)
            .json({ status: true, message: "PDF encontrado", data: pdf });
    }
    catch (error) {
        console.error("Error al obtener PDF:", error);
        return res.status(500).json({
            status: false,
            message: error instanceof Error ? error.message : "Error desconocido",
        });
    }
};
exports.getPdfById = getPdfById;
