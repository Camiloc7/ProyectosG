"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PDF_models_1 = __importDefault(require("./PDF.models"));
const InfoExtraPDF_models_1 = __importDefault(require("./InfoExtraPDF.models"));
const Items_models_1 = __importDefault(require("./Items.models"));
const Seccion_models_1 = __importDefault(require("./Seccion.models"));
const Estadistica_models_1 = __importDefault(require("./Estadistica.models"));
const Descripcion_models_1 = __importDefault(require("./Descripcion.models"));
const ItemsUsuarios_models_1 = __importDefault(require("./ItemsUsuarios.models"));
const SeccionPDF_1 = __importDefault(require("./SeccionPDF"));
const ItemsPDF_1 = __importDefault(require("./ItemsPDF"));
const SideData_1 = __importDefault(require("./SideData"));
const TextData_1 = __importDefault(require("./TextData"));
const FirmaData_1 = __importDefault(require("./FirmaData"));
const ImageData_1 = __importDefault(require("./ImageData"));
// Un PDF tiene muchos InfoExtraPDF
PDF_models_1.default.hasMany(InfoExtraPDF_models_1.default, { foreignKey: "pdfID", as: "infoExtra" });
InfoExtraPDF_models_1.default.belongsTo(PDF_models_1.default, { foreignKey: "pdfID", as: "pdf" });
// Un Item tiene un pdf un pdf solo puede pertenecer a un item
Items_models_1.default.hasOne(PDF_models_1.default, { foreignKey: "itemID", as: "pdf" });
PDF_models_1.default.belongsTo(Items_models_1.default, { foreignKey: "itemID", as: "item" });
// Un Item tiene varias Estadisticas, un a nestadistica solo pertenece a un item
Items_models_1.default.hasMany(Estadistica_models_1.default, { foreignKey: "itemID", as: "estadisticas" });
Estadistica_models_1.default.belongsTo(Items_models_1.default, { foreignKey: "itemID", as: "item" });
// Un item pertenece a una sola descripcion una descripcion tiene varios items
Items_models_1.default.belongsTo(Descripcion_models_1.default, {
    foreignKey: "descripcionID",
    as: "descripcion",
});
Descripcion_models_1.default.hasMany(Items_models_1.default, { foreignKey: "descripcionID", as: "items" });
//Una seccion tiene muchas descripciones una descripcion pertenece una seccion
Seccion_models_1.default.hasMany(Descripcion_models_1.default, { foreignKey: "seccionID", as: "descripciones" });
Descripcion_models_1.default.belongsTo(Seccion_models_1.default, { foreignKey: "seccionID", as: "seccion" });
Items_models_1.default.hasOne(ItemsUsuarios_models_1.default, { foreignKey: "itemID", as: "usuarioItem" });
ItemsUsuarios_models_1.default.belongsTo(Items_models_1.default, { foreignKey: "itemID", as: "item" });
//!NUEVAS ASOCIACIONES
// PDF → Secciones
PDF_models_1.default.hasMany(SeccionPDF_1.default, { foreignKey: "pdfID", as: "secciones" });
SeccionPDF_1.default.belongsTo(PDF_models_1.default, { foreignKey: "pdfID", as: "pdf" });
// SeccionPDF → ItemPDF
ItemsPDF_1.default.belongsTo(SeccionPDF_1.default, {
    foreignKey: "SeccionPdfID", // <–– coincide con tu init
    as: "seccion",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
});
SeccionPDF_1.default.hasMany(ItemsPDF_1.default, {
    foreignKey: "SeccionPdfID", // <–– idem
    as: "items",
});
// SeccionPDF → SideData
SeccionPDF_1.default.hasMany(SideData_1.default, { foreignKey: "seccionPdfId", as: "sideData" });
SideData_1.default.belongsTo(SeccionPDF_1.default, { foreignKey: "seccionPdfId", as: "seccion" });
// ItemPDF → TextData / FirmaData / ImageData
ItemsPDF_1.default.hasMany(TextData_1.default, { foreignKey: "itemPdfId", as: "textos" });
TextData_1.default.belongsTo(ItemsPDF_1.default, { foreignKey: "itemPdfId", as: "item" });
ItemsPDF_1.default.hasMany(FirmaData_1.default, { foreignKey: "itemPdfId", as: "firmas" });
FirmaData_1.default.belongsTo(ItemsPDF_1.default, { foreignKey: "itemPdfId", as: "item" });
ItemsPDF_1.default.hasMany(ImageData_1.default, { foreignKey: "itemPdfId", as: "imagenes" });
ImageData_1.default.belongsTo(ItemsPDF_1.default, { foreignKey: "itemPdfId", as: "item" });
