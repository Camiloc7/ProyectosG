import { jsPDF } from "jspdf";

export interface CajaData {
  id: string;
  usuario_cajero_id: string;
  saldo_inicial_caja: string;
  total_pagos_efectivo: string;
  gastos_operacionales: string;
  saldo_final_contado: string;
  diferencia_caja: string;
  total_ventas_brutas: string;
  total_descuentos: string;
  total_neto_ventas: string;
  total_recaudado: string;
  denominaciones_apertura?: Record<string, number>;
  denominaciones_cierre?: Record<string, number>;
}

const formatCurrency = (value: string | number) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
};

// 👉 Función para cortar texto largo y agregar guion si continúa
const splitLongText = (text: string, maxChars = 24): string[] => {
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) {
    const segment = text.slice(i, i + maxChars);
    parts.push(i + maxChars < text.length ? segment + "-" : segment);
  }
  return parts;
};

export const handlePrint = (item: CajaData) => {
  const doc = new jsPDF({
    unit: "mm",
    format: [80, 300], // tamaño típico de ticket térmico
  });

  const boldFontSize = 13;
  const normalFontSize = 11;
  let y = 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CIERRE DE CAJA", 40, y, { align: "center" });

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(normalFontSize);

  doc.text(`Fecha: ${new Date().toLocaleString()}`, 5, y);
  y += 6;

  // 🔹 ID de cierre con salto de línea automático
  const idLines = splitLongText(item.id, 24);
  doc.text("ID de Cierre:", 5, y);
  y += 6;
  idLines.forEach((line) => {
    doc.text(line, 10, y);
    y += 5;
  });

  // 🔹 ID de cajero con salto de línea automático
  const cajeroLines = splitLongText(item.usuario_cajero_id, 24);
  doc.text("Cajero:", 5, y);
  y += 6;
  cajeroLines.forEach((line) => {
    doc.text(line, 10, y);
    y += 5;
  });

  doc.text("------------------------------------", 5, y);
  y += 6;

  const addRow = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 5, y);
    doc.text(value, 75, y, { align: "right" });
    y += 6;
  };

  addRow("Saldo Inicial Caja:", formatCurrency(item.saldo_inicial_caja));
  addRow("Pagos en Efectivo:", formatCurrency(item.total_pagos_efectivo));
  addRow("Ingresos Extra:", "$0.00");
  addRow("Gastos Operacionales:", formatCurrency(item.gastos_operacionales));

  doc.text("------------------------------------", 5, y);
  y += 6;

  const saldoEsperado =
    parseFloat(item.saldo_inicial_caja) + parseFloat(item.total_pagos_efectivo);
  addRow("SALDO ESPERADO:", formatCurrency(saldoEsperado));
  addRow("SALDO CONTADO:", formatCurrency(item.saldo_final_contado));
  addRow("DIFERENCIA:", formatCurrency(item.diferencia_caja));

  doc.text("------------------------------------", 5, y);
  y += 6;

  addRow("Ventas Brutas:", formatCurrency(item.total_ventas_brutas));
  addRow("Descuentos:", formatCurrency(item.total_descuentos));
  addRow("Total Neto Ventas:", formatCurrency(item.total_neto_ventas));
  addRow("Total Recaudado:", formatCurrency(item.total_recaudado));

  doc.text("------------------------------------", 5, y);
  y += 6;

  // Denominaciones cierre
  if (item.denominaciones_cierre) {
    doc.setFont("helvetica", "bold");
    doc.text("Denominaciones Cierre:", 5, y);
    y += 6;
    Object.entries(item.denominaciones_cierre).forEach(([den, cantidad]) => {
      addRow(`$${parseInt(den).toLocaleString("en-US")}`, cantidad.toString());
    });
  }

  // Abrir directamente el visor o diálogo de impresión
  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
};
