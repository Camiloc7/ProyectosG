import { Request, Response } from "express";
import { MyJwtPayload } from "../../types/types";
import PDF from "../../models/PDF.models";
import Items from "../../models/Items.models";
import Descripcion from "../../models/Descripcion.models";
import Seccion from "../../models/Seccion.models";
import InfoExtraPDF from "../../models/InfoExtraPDF.models";
// import sequelize from "sequelize";
import ItemsUsuarios from "../../models/ItemsUsuarios.models";
import SeccionPDF from "../../models/SeccionPDF";
import SideData from "../../models/SideData";
import ItemPDF from "../../models/ItemsPDF";
import TextData from "../../models/TextData";
import FirmaData from "../../models/FirmaData";
import { sequelize } from "../../config/database";
import ImageData from "../../models/ImageData";
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import TableData from "../../models/TableData.models";

// Configuración del cliente de S3
const s3Client = new S3Client({ region: process.env.AWS_REGION });

export const getListaPlanear = async (req: Request, res: Response) => {
  try {
    const { id_empresa: usuarioID } = req.user as MyJwtPayload;
    if (!usuarioID) throw new Error("Usuario no autenticado.");

    const itemsPlanear = await Items.findAll({
      attributes: ["id", "actividad", "codigo", "valorItemEstandar"],
      include: [
        // 1) filtro por ciclo PLANEAR
        {
          model: Descripcion,
          as: "descripcion",
          attributes: [],
          include: [
            {
              model: Seccion,
              as: "seccion",
              attributes: [],
              where: { ciclo: "PLANEAR" },
            },
          ],
        },
        // 2) inclusión de ItemsUsuarios (alias = 'usuarioItem')
        {
          model: ItemsUsuarios,
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
  } catch (error) {
    console.error("Error al obtener items PLANEAR:", error);
    return res.status(500).json({
      status: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

export const createPdf = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { id_empresa: usuarioID } = req.user as any;
    if (!usuarioID) throw new Error("Usuario no autenticado.");
    const {
      titulo,
      versionDocumento,
      codigo,
      itemID,
      fechaCreacion,
      sections,
    } = req.body;
    // console.log("Body", req.body);
    if (!itemID) throw new Error("Es necesario un id de item.");

    // Validación de posiciones únicas
    const posCheck = (arr: any[], key: string, context: string) => {
      const positions = arr.map((el: any) => el[key]);
      const unique = new Set(positions);
      if (unique.size !== positions.length) {
        throw new Error(`Posiciones duplicadas en ${context}.`);
      }
    };

    sections.forEach((s: any) => {
      posCheck(sections, "poscicion", "secciones");
      if (s.sideData?.length)
        posCheck(s.sideData, "poscicion", `sideData sección ${s.poscicion}`);
      if (s.items?.length)
        posCheck(s.items, "poscicion", `items sección ${s.poscicion}`);
    });

    // Eliminar PDF previo y todo lo relacionado si existe
    const existing = await PDF.findOne({
      where: { usuarioID, itemID },
      transaction: t,
    });
    if (existing) {
      const pdfId = existing.id;

      // Fetch secciones
      const secciones = await SeccionPDF.findAll({
        where: { pdfID: pdfId },
        transaction: t,
      });
      for (const sec of secciones) {
        // Eliminar SideData
        await SideData.destroy({
          where: { SeccionPdfID: sec.id },
          transaction: t,
        });

        // Fetch items de la sección
        const items = await ItemPDF.findAll({
          where: { SeccionPdfID: sec.id },
          transaction: t,
        });
        for (const it of items) {
          // Eliminar datos de tipo
          await TextData.destroy({
            where: { itemPdfId: it.id },
            transaction: t,
          });
          await FirmaData.destroy({
            where: { itemPdfId: it.id },
            transaction: t,
          });
          await ImageData.destroy({
            where: { itemPdfId: it.id },
            transaction: t,
          });
          await TableData.destroy({
            where: { itemPdfId: it.id },
            transaction: t,
          });
        }

        // Eliminar ItemPDF
        await ItemPDF.destroy({
          where: { SeccionPdfID: sec.id },
          transaction: t,
        });
      }

      // Eliminar SeccionPDF
      await SeccionPDF.destroy({ where: { pdfID: pdfId }, transaction: t });
      // Eliminar PDF
      await PDF.destroy({ where: { id: pdfId }, transaction: t });
    }

    // Crear PDF
    const pdf = await PDF.create(
      { titulo, versionDocumento, codigo, fechaCreacion, usuarioID, itemID },
      { transaction: t }
    );

    // Insertar secciones y subdatos
    for (const sec of sections) {
      const seccion = await SeccionPDF.create(
        { id: sec.id, pdfID: pdf.id, poscicion: sec.poscicion },
        { transaction: t }
      );

      if (sec.sideData?.length) {
        await SideData.bulkCreate(
          sec.sideData.map((sd: any) => ({
            seccionPdfId: seccion.id,
            etiqueta: sd.label,
            contenido: sd.value,
            poscicion: sd.poscicion,
          })),
          { transaction: t }
        );
      }

      for (const it of sec.items || []) {
        const item = await ItemPDF.create(
          {
            SeccionPdfID: seccion.id,
            tipo: it.tipo,
            poscicion: it.poscicion,
          },
          { transaction: t }
        );

        if (it.tipo === "texto") {
          await TextData.create(
            {
              itemPdfId: item.id,
              subtitulo: it.data.subtitulo,
              contenido: it.data.contenido,
            },
            { transaction: t }
          );
        } else if (it.tipo === "firma") {
          await FirmaData.create(
            {
              itemPdfId: item.id,
              nombre: it.data.nombre,
              cargo: it.data.cargo,
            },
            { transaction: t }
          );
        } else if (it.tipo === "imagen") {
          // console.log(it.data);
          await ImageData.create(
            {
              itemPdfId: item.id,
              url: it.data.urlImagen || "",
              anchura: it.data.width,
              altura: it.data.height,
            },
            { transaction: t }
          );
        } else if (it.tipo === "tabla") {
          // Guardar datos de tabla
          await TableData.create(
            {
              itemPdfId: item.id,
              headers: it.data.headers,
              rows: it.data.rows,
            },
            { transaction: t }
          );
        } else {
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
  } catch (error) {
    await t.rollback();
    console.error("Error al procesar PDF:", error);
    return res.status(500).json({
      status: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

export const getPdfById = async (req: Request, res: Response) => {
  try {
    const { id_empresa: usuarioID } = req.user as any;
    if (!usuarioID) throw new Error("Usuario no autenticado.");

    const { itemID } = req.params;
    if (!itemID) {
      return res
        .status(400)
        .json({ status: false, message: "Es necesario el id" });
    }

    const pdfInstance = await PDF.findOne({
      where: { itemID, usuarioID },
      include: [
        {
          model: SeccionPDF,
          as: "secciones",
          include: [
            { model: SideData, as: "sideData" },
            {
              model: ItemPDF,
              as: "items",
              include: [
                { model: TextData, as: "textos" },
                { model: FirmaData, as: "firmas" },
                { model: ImageData, as: "imagenes" },
                { model: TableData, as: "tablas" },
              ],
            },
          ],
        },
      ],
      order: [[{ model: SeccionPDF, as: "secciones" }, "poscicion", "ASC"]],
    });

    if (!pdfInstance) {
      return res
        .status(200)
        .json({ status: false, message: "Aún no creaste este PDF" });
    }

    const pdfPlain = pdfInstance.get({ plain: true }) as any;

    // console.log("pdfInstance", pdfInstance);

    const pdfData = {
      ...pdfPlain,
      secciones: await Promise.all(
        pdfPlain.secciones.map(async (sec: any) => ({
          ...sec,
          items: await Promise.all(
            sec.items.map(async (item: any) => {
              // Pre-firmar imágenes
              const imagenes = await Promise.all(
                (item.imagenes || []).map(async (img: any) => {
                  let signedUrl = "";
                  if (img.url) {
                    try {
                      const cmd = new GetObjectCommand({
                        Bucket: process.env.BUCKET_NAME!,
                        Key: img.url,
                      });
                      signedUrl = await getSignedUrl(s3Client, cmd, {
                        expiresIn: 3600,
                      });
                    } catch (e) {
                      console.error(`Error pre-firmando ${img.url}:`, e);
                    }
                  }
                  return { ...img, url: signedUrl, key: img.url };
                })
              );

              // Incluir tablas directamente
              const tablas = (item.tablas || []).map((tbl: any) => ({
                headers: tbl.headers,
                rows: tbl.rows,
              }));

              return { ...item, imagenes, tablas };
            })
          ),
        }))
      ),
    };

    return res
      .status(200)
      .json({ status: true, message: "PDF encontrado", data: pdfData });
  } catch (error) {
    console.error("Error al obtener PDF:", error);
    return res.status(500).json({
      status: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};
