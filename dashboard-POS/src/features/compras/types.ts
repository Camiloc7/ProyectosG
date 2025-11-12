
export type IFacturaItem = {
  ingredienteId: string;
  cantidad: number;
  unidad_medida: string;
  costo_unitario: number;
};

export type IFacturaFormData = {
  proveedorId: string;
  numero_factura: string;
  items: IFacturaItem[];
};