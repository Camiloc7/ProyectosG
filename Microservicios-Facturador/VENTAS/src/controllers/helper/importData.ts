// // src/controllers/import.controller.ts

//!=========================================================================
//!ESTE FUE EL CODIGO QUE SE UTILIZO PARA EXTRAER LA INFORMACION DE LOS CSVS
//!=========================================================================
// import { Request, Response } from "express";
// import { sequelize } from "../../config/database";
// import { parseCSVRows } from "./csv"; // extrae esta función de tus controladores
// import Seccion, { SeccionAttributes } from "../../models/Seccion.models";
// import Descripcion, {
//   DescripcionAttributes,
// } from "../../models/Descripcion.models";
// import Items, { ItemsAttributes } from "../../models/Items.models";
// import fs from "fs";
// import path from "path";
// const CSV_FILE_PATH = path.resolve(
//   __dirname,
//   "../../data/SECCIONES-SG-SST.csv"
// );

// // Funciones de servicio PURAS (devuelven arrays, no hacen res.json)
// async function buildData() {
//   const rows = parseCSVRows(CSV_FILE_PATH);

//   // 1) Secciones
//   const seccionMap = new Map<string, SeccionAttributes>();
//   rows.forEach((row) => {
//     const nombre = row.SECCION ?? "";
//     if (!seccionMap.has(nombre)) {
//       seccionMap.set(nombre, {
//         id: seccionMap.size + 1,
//         nombre,
//         ciclo: row.CICLO ?? "",
//       });
//     }
//   });
//   const secciones = Array.from(seccionMap.values());

//   // 2) Descripciones
//   const descripcionMap = new Map<string, DescripcionAttributes>();
//   rows.forEach((row) => {
//     const key = row.DESCRIPCIONES ?? "";
//     if (!descripcionMap.has(key)) {
//       const seccionInfo = seccionMap.get(row.SECCION ?? "");
//       descripcionMap.set(key, {
//         id: descripcionMap.size + 1,
//         descripcion: key,
//         pesoPorcentual: Number(row.PESOPORCENTUAL) || 0,
//         seccionID: seccionInfo!.id,
//         calificacionSeccion: Number(row.CALIFICACIONSECCION) || 0,
//       });
//     }
//   });
//   const descripciones = Array.from(descripcionMap.values());

//   // 3) Items
//   const itemMap = new Map<string, ItemsAttributes>();
//   const prefixRegex = /^(\d+\.\d+\.\d+)\.?\s*(.*)$/;
//   rows.forEach((row) => {
//     const raw = row.ITEMDELESTANDAR ?? "";
//     if (!itemMap.has(raw)) {
//       const match = raw.match(prefixRegex);
//       const codigo = match?.[1] ?? null;
//       const actividad = match?.[2] ?? raw;
//       const descInfo = descripcionMap.get(row.DESCRIPCIONES ?? "");
//       itemMap.set(raw, {
//         id: itemMap.size + 1,
//         descripcionID: descInfo!.id,
//         valorItemEstandar: Number(row.VALORDELITEMDELESTANDAR) || 0,
//         actividad,
//         codigo,
//       });
//     }
//   });
//   const items = Array.from(itemMap.values());

//   return { secciones, descripciones, items };
// }

// // Controlador principal
// // export const importAll = async (req: Request, res: Response) => {
// //   const transaction = await sequelize.transaction();
// //   try {
// //     // 0) Check pre-existence
// //     const existing = await Seccion.count({ transaction });
// //     if (existing > 0) {
// //       await transaction.rollback();
// //       return res.status(409).json({
// //         success: false,
// //         message: "Los datos ya fueron importados anteriormente.",
// //       });
// //     }

// //     // 1) Construir datos
// //     const { secciones, descripciones, items } = await buildData();

// //     // 2) Insertar en orden
// //     await Seccion.bulkCreate(secciones, { transaction });
// //     await Descripcion.bulkCreate(descripciones, { transaction });
// //     await Items.bulkCreate(items, { transaction });

// //     // 3) Confirmar
// //     await transaction.commit();
// //     return res.status(200).json({
// //       success: true,
// //       message: "Importación completada correctamente.",
// //       counts: {
// //         secciones: secciones.length,
// //         descripciones: descripciones.length,
// //         items: items.length,
// //       },
// //     });
// //   } catch (error) {
// //     await transaction.rollback();
// //     console.error("Import error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: error instanceof Error ? error.message : "Error desconocido",
// //     });
// //   }
// // };
