import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

interface UnidadMedida {
  id: number;
  nombre: string;
}

interface Retencion {
  id: number;
  nombre: string;
  baseMinimaPesos: number;
  porcentaje: number;
}

export const getUnidadesDeMedida = async (req: Request, res: Response) => {
  try {
    // Ruta del archivo CSV
    const csvPath = path.join(__dirname, "../../../data/unidadesDeMedida.csv");
    const fileContent = fs.readFileSync(csvPath, { encoding: "utf-8" });

    // Separamos las líneas y eliminamos las vacías
    const lines = fileContent.split("\n").filter((line) => line.trim() !== "");

    // Si el CSV tiene encabezado, saltamos la primera línea
    let startIndex = 0;
    if (lines[0].toLowerCase().includes("nombre")) {
      startIndex = 1;
    }

    const unidades: UnidadMedida[] = [];
    let id = 1;
    // Iteramos por cada línea del CSV a partir del índice correspondiente
    for (let i = startIndex; i < lines.length; i++) {
      const columns = lines[i].split(",");
      // Suponemos que la segunda columna (índice 1) es donde está el nombre
      const nombre = columns[1]?.trim();
      if (nombre) {
        unidades.push({
          id: id++,
          nombre,
        });
      }
    }

    res.json({
      status: true,
      message: "Unidades obtenidas",
      data: unidades,
    });
  } catch (error) {
    console.error("Error obteniendo las medidas:", error);
    res.status(500).json({ status: false, message: "Error interno" });
  }
};

export const getRetenciones = async (req: Request, res: Response) => {
  try {
    // 1. Ruta corregida al CSV
    const csvPath = path.join(__dirname, "../../../data/retenciones.csv");
    console.log("Leyendo CSV en:", csvPath);
    const fileContent = fs.readFileSync(csvPath, "utf-8");

    // 2. Parseo robusto con csv-parse
    const records = parse(fileContent, {
      columns: true, // usa la primera línea como cabecera
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    // 3. Transformación
    const retenciones: Retencion[] = records.map((row, idx) => {
      // Ajusta los nombres de columna según tu CSV
      const concepto = row["Concepto"];
      const basePesosRaw = row["Base mínima en pesos  ≥"] || "";
      const porcentajeRaw = row["%"] || "";

      const limpiarNumero = (valor: string): number => {
        const num = valor.match(/[\d.,]+/)?.[0] ?? "0";
        return Number(num.replace(/,/g, ""));
      };

      return {
        id: idx + 1,
        nombre: concepto,
        baseMinimaPesos: limpiarNumero(basePesosRaw),
        porcentaje: limpiarNumero(porcentajeRaw),
      };
    });

    // 4. Respuesta
    res.json({
      status: true,
      message: "Retenciones obtenidas",
      data: retenciones,
    });
  } catch (error: any) {
    console.error("Error obteniendo las retenciones:", error);
    res
      .status(500)
      .json({ status: false, message: error.message || "Error interno" });
  }
};
