//!=========================================================================
//!ESTE FUE EL CODIGO QUE SE UTILIZO PARA EXTRAER LA INFORMACION DE LOS CSVS
//!=========================================================================

// import Papa from "papaparse";
// import fs from "fs";
// import path from "path";
// import { Request, Response } from "express";
// import { SeccionAttributes } from "../../models/Seccion.models";
// import Descripcion, {
//   DescripcionAttributes,
// } from "../../models/Descripcion.models";
// import { ItemsAttributes } from "../../models/Items.models";

// // Ruta al CSV
// const CSV_FILE_PATH = path.resolve(
//   __dirname,
//   "../../data/SECCIONES-SG-SST.csv"
// );

// // Interfaces locales
// interface Item {
//   ciclo: string;
//   pesoPorcentual: number | null;
//   valorItemEstandar: number;
//   codigo: string;
//   actividad: string;
//   seccion: string;
//   calificacionSeccion: string;
// }

// // Función genérica: leer y parsear CSV
// export function parseCSVRows(filePath: string): any[] {
//   const fileContent = fs.readFileSync(filePath, "utf-8");
//   const parsed = Papa.parse(fileContent, {
//     header: true,
//     dynamicTyping: true,
//     skipEmptyLines: true,
//   });

//   if (parsed.errors.length > 0) {
//     const messages = parsed.errors.map((e) => e.message).join(", ");
//     throw new Error(`Errores al parsear CSV: ${messages}`);
//   }

//   return parsed.data as any[];
// }

// Controlador: obtener secciones únicas con ID incremental
// export const getSecciones = async (req: Request, res: Response) => {
//   try {
//     const rows = parseCSVRows(CSV_FILE_PATH);
//     const seccionMap = new Map<string, SeccionAttributes>();

//     rows.forEach((row) => {
//       const nombre = row.SECCION || "";
//       if (!seccionMap.has(nombre)) {
//         seccionMap.set(nombre, {
//           id: seccionMap.size + 1,
//           nombre,
//           ciclo: row.CICLO || "",
//         });
//       }
//     });

//     const secciones = Array.from(seccionMap.values());
//     res.status(200).json({
//       success: true,
//       message: "Secciones procesadas correctamente",
//       data: secciones,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: error instanceof Error ? error.message : "Error desconocido",
//     });
//   }
// };

// Controlador: obtener descripciones únicas con ID incremental y asignar sección
// export const getDescripciones = async (req: Request, res: Response) => {
//   try {
//     const rows = parseCSVRows(CSV_FILE_PATH);

//     // Primero, construir map de secciones para obtener IDs
//     const seccionMap = new Map<string, SeccionAttributes>();
//     rows.forEach((row) => {
//       const nombre = row.SECCION || "";
//       if (!seccionMap.has(nombre)) {
//         seccionMap.set(nombre, {
//           id: seccionMap.size + 1,
//           nombre,
//           ciclo: row.CICLO || "",
//         });
//       }
//     });

//     // Luego, construir descripciones únicas
//     const descriptionMap = new Map<string, DescripcionAttributes>();
//     rows.forEach((row) => {
//       const descripcion = row.DESCRIPCIONES || "";
//       if (!descriptionMap.has(descripcion)) {
//         const seccionInfo = seccionMap.get(row.SECCION || "");
//         descriptionMap.set(descripcion, {
//           id: descriptionMap.size + 1,
//           descripcion,
//           pesoPorcentual: row.PESOPORCENTUAL ?? null,
//           seccionID: seccionInfo ? seccionInfo.id : 1,
//           calificacionSeccion: row.CALIFICACIONSECCION,
//         });
//       }
//     });

//     const descripciones = Array.from(descriptionMap.values());
//     res.status(200).json({
//       success: true,
//       message: "Descripciones procesadas correctamente",
//       data: descripciones,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: error instanceof Error ? error.message : "Error desconocido",
//     });
//   }
// };

// export const getItems = async (req: Request, res: Response) => {
//   try {
//     const rows = parseCSVRows(CSV_FILE_PATH);

//     // Primero, construir map de descripciones para obtener IDs
//     const descriptionMap = new Map<string, DescripcionAttributes>();
//     rows.forEach((row) => {
//       const nombre = row.DESCRIPCIONES || "";
//       if (!descriptionMap.has(nombre)) {
//         descriptionMap.set(nombre, {
//           id: descriptionMap.size + 1,
//           descripcion: row.DESCRIPCIONES || "",
//           calificacionSeccion: row.CALIFICACIONSECCION || "",
//           pesoPorcentual: row.PESOPORCENTUAL || "",
//           seccionID: row.CICLO || "",
//         });
//       }
//     });

//     // Luego, construir items únicos extrayendo el código de la actividad
//     const itemMap = new Map<string, ItemsAttributes>();
//     const prefixRegex = /^(\d+\.\d+\.\d+)\.?\s*(.*)$/;

//     rows.forEach((row) => {
//       const raw = row.ITEMDELESTANDAR || "";
//       const match = raw.match(prefixRegex);

//       // Si coincide, match[1] = "1.1.1", match[2] = resto del texto
//       const codigo = match ? match[1] : null;
//       const actividad = match ? match[2] : raw;

//       if (!itemMap.has(raw)) {
//         const descripcionInfo = descriptionMap.get(row.DESCRIPCIONES || "");
//         itemMap.set(raw, {
//           id: itemMap.size + 1,
//           descripcionID: descripcionInfo ? descripcionInfo.id : 1,
//           valorItemEstandar: row.VALORDELITEMDELESTANDAR,
//           actividad,
//           codigo,
//         });
//       }
//     });

//     const items = Array.from(itemMap.values());
//     res.status(200).json({
//       success: true,
//       message: "items procesados correctamente",
//       data: items,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: error instanceof Error ? error.message : "Error desconocido",
//     });
//   }
// };
