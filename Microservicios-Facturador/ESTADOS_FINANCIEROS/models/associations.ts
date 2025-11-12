import PDF from "./PDF.models";
import InfoExtraPDF from "./InfoExtraPDF.models";
import Items from "./Items.models";
import Seccion from "./Seccion.models";
import Estadistica from "./Estadistica.models";
import Descripcion from "./Descripcion.models";
import ItemsUsuarios from "./ItemsUsuarios.models";
import SeccionPDF from "./SeccionPDF";
import ItemPDF from "./ItemsPDF";
import SideData from "./SideData";
import TextData from "./TextData";
import FirmaData from "./FirmaData";
import ImageData from "./ImageData";
import TableData from "./TableData.models";

// Un PDF tiene muchos InfoExtraPDF
PDF.hasMany(InfoExtraPDF, { foreignKey: "pdfID", as: "infoExtra" });
InfoExtraPDF.belongsTo(PDF, { foreignKey: "pdfID", as: "pdf" });

// Un Item tiene un pdf un pdf solo puede pertenecer a un item
Items.hasOne(PDF, { foreignKey: "itemID", as: "pdf" });
PDF.belongsTo(Items, { foreignKey: "itemID", as: "item" });

// Un Item tiene varias Estadisticas, un a nestadistica solo pertenece a un item
Items.hasMany(Estadistica, { foreignKey: "itemID", as: "estadisticas" });
Estadistica.belongsTo(Items, { foreignKey: "itemID", as: "item" });
// Un item pertenece a una sola descripcion una descripcion tiene varios items
Items.belongsTo(Descripcion, {
  foreignKey: "descripcionID",
  as: "descripcion",
});
Descripcion.hasMany(Items, { foreignKey: "descripcionID", as: "items" });

//Una seccion tiene muchas descripciones una descripcion pertenece una seccion
Seccion.hasMany(Descripcion, { foreignKey: "seccionID", as: "descripciones" });
Descripcion.belongsTo(Seccion, { foreignKey: "seccionID", as: "seccion" });

Items.hasOne(ItemsUsuarios, { foreignKey: "itemID", as: "usuarioItem" });
ItemsUsuarios.belongsTo(Items, { foreignKey: "itemID", as: "item" });

//!NUEVAS ASOCIACIONES
// PDF → Secciones
PDF.hasMany(SeccionPDF, { foreignKey: "pdfID", as: "secciones" });
SeccionPDF.belongsTo(PDF, { foreignKey: "pdfID", as: "pdf" });

// SeccionPDF → ItemPDF
ItemPDF.belongsTo(SeccionPDF, {
  foreignKey: "SeccionPdfID", // <–– coincide con tu init
  as: "seccion",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
SeccionPDF.hasMany(ItemPDF, {
  foreignKey: "SeccionPdfID", // <–– idem
  as: "items",
});

// SeccionPDF → SideData
SeccionPDF.hasMany(SideData, { foreignKey: "seccionPdfId", as: "sideData" });
SideData.belongsTo(SeccionPDF, { foreignKey: "seccionPdfId", as: "seccion" });

// ItemPDF → TextData / FirmaData / ImageData
ItemPDF.hasMany(TextData, { foreignKey: "itemPdfId", as: "textos" });
TextData.belongsTo(ItemPDF, { foreignKey: "itemPdfId", as: "item" });

ItemPDF.hasMany(FirmaData, { foreignKey: "itemPdfId", as: "firmas" });
FirmaData.belongsTo(ItemPDF, { foreignKey: "itemPdfId", as: "item" });

ItemPDF.hasMany(ImageData, { foreignKey: "itemPdfId", as: "imagenes" });
ImageData.belongsTo(ItemPDF, { foreignKey: "itemPdfId", as: "item" });

ItemPDF.hasMany(TableData, { foreignKey: "itemPdfId", as: "tablas" });
TableData.belongsTo(ItemPDF, { foreignKey: "itemPdfId", as: "item" });
