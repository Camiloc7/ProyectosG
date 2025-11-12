export interface Establecimiento {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  activo: boolean;
  impuesto_porcentaje: string;
  created_at: string;
  updated_at: string;
}
export interface Mesa {
  id: string;
  establecimiento_id: string;
  numero: string;
  capacidad: number;
  estado: EstadoMesa;
  ubicacion_descripcion?: string;
  created_at: string;
  updated_at: string;
  establecimiento?: Establecimiento;
}

export enum EstadoMesa {
  LIBRE = "LIBRE",
  OCUPADA = "OCUPADA",
  // MANTENIMIENTO = "MANTENIMIENTO",
}

export const ESTADOS_MESA: EstadoMesa[] = [
  EstadoMesa.LIBRE,
  EstadoMesa.OCUPADA,
  // EstadoMesa.MANTENIMIENTO,
];

export interface Proveedor {
  id: string;
  nombre: string;
  contacto: string;
  telefono: string;
  email?: string;
  direccion?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Ingrediente {
  id: string;
  establecimiento_id: string;
  nombre: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  fecha_ultima_compra?: string;
  cantidad_ultima_compra?: number;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}
export interface RecetaItem {
  ingrediente_id: string;
  cantidad_necesaria: number;
}
export interface Producto {
  id: string;
  establecimiento_id: string;
  categoria_id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen_url?: string;
  activo: boolean;
  receta?: RecetaItem[];
  created_at?: string;
  updated_at?: string;
}
export enum EstadoCocina {
  PENDIENTE = "PENDIENTE",
  PREPARANDO = "PREPARANDO",
  LISTO = "LISTO",
}

export interface PedidoItem {
  id: string;
  pedido_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario_al_momento_venta: number;
  notas_item?: string;
  estado_cocina: EstadoCocina;
  fecha_hora_estado_cocina_cambio: string;
  created_at: string;
  updated_at: string;
  producto: Producto;
}

export interface Pedido {
  id: string;
  establecimiento_id: string;
  mesa_id?: string;
  usuario_creador_id: string;
  usuario_domiciliario_id?: string;
  estado: EstadoPedido;
  tipo_pedido: TipoPedido;
  total_estimado: number;
  cliente_nombre?: string;
  cliente_direccion?: string;
  cliente_telefono?: string;
  fecha_hora_cierre?: string;
  created_at: string;
  updated_at: string;
  mesa?: Mesa;
  establecimiento?: Establecimiento;
  usuarioCreador?: any;
  usuarioDomiciliario?: any;
  pedidoItems: PedidoItem[];
}

export interface CreatePedidoItemDto {
  producto_id: string;
  cantidad: number;
  notas_item?: string;
}

export interface CreatePedidoDto {
  establecimiento_id: string;
  mesa_id?: string;
  tipo_pedido: TipoPedido;
  pedidoItems: CreatePedidoItemDto[];
  cliente_nombre?: string;
  cliente_direccion?: string;
  cliente_telefono?: string;
}

export interface UpdatePedidoItemDto {
  cantidad?: number;
  notas_item?: string;
  estado_cocina?: EstadoCocina;
}

export enum EstadoPedido {
  ABIERTO = "ABIERTO",
  EN_PREPARACION = "EN_PREPARACION",
  LISTO_PARA_ENTREGAR = "LISTO_PARA_ENTREGAR",
  CERRADO = "CERRADO",
  PAGADO = "PAGADO",
  CANCELADO = "CANCELADO",
  ENTREGADO = "ENTREGADO",
  LISTO = "LISTO",
}

export enum TipoPedido {
  MESA = "MESA",
  PARA_LLEVAR = "PARA_LLEVAR",
  DOMICILIO = "DOMICILIO",
}

export interface CreateIngredienteDto {
  establecimiento_id: string;
  nombre: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  observaciones?: string;
}

export interface UpdateIngredienteDto {
  nombre?: string;
  unidad_medida?: string;
  stock_actual?: number;
  stock_minimo?: number;
  costo_unitario?: number;
  observaciones?: string;
}

export interface Compra {
  id: string;
  establecimiento_id: string;
  ingrediente_id: string;
  proveedor_id: string;
  cantidad_comprada: number;
  unidad_medida_compra: string;
  costo_unitario_compra: number;
  costo_total: number;
  fecha_compra: string;
  numero_factura?: string;
  notas?: string;
  created_at?: string;
  updated_at?: string;
  ingrediente?: Ingrediente;
  proveedor?: Proveedor;
}

export interface CreateCompraDto {
  establecimiento_id: string;
  ingrediente_id: string;
  proveedor_id: string;
  cantidad_comprada: number;
  unidad_medida_compra: string;
  costo_unitario_compra: number;
  fecha_compra: string;
  numero_factura?: string;
  notas?: string;
}

export interface UpdateCompraDto {
  cantidad_comprada?: number;
  unidad_medida_compra?: string;
  costo_unitario_compra?: number;
  fecha_compra?: string;
  numero_factura?: string;
  notas?: string;
}

export interface UpdateIngredienteStockDto {
  cantidad: number;
  tipo: "sumar" | "restar";
}
export type IProveedor = {
  id: string;
  nombre: string;
  nit: string;
  contacto: string;
  telefono: string;
  email: string;
};

export type IProveedorForm = {
  id: string;
  nombre: string;
  contacto: string;
  telefono: string;
  email: string;
};

export interface IFormPedidos {
  id?: string;
  origen: string;
  telefono: string;
  notas?: string;
  nombre: string;
  direccion: string;
  idOrdenExterna: string;
  mesa: string;
  productos: Array<{
    id: string;
    cantidad: number;
    nota?: string;
  }>;
}

export type IPedidos = {
  id: string;
  created_at: Date;
  codigo_pedido: string;
  mesa_id: string;
  mesa_numero: string;
  usuario_domiciliario_id?: string;
  estado: string;
  tipo_pedido: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  cliente_direccion?: string;
  total_estimado: string;
  descuentos_aplicados: string;
  notas?: string;
  pedidoItems: IItemsPedidos[];
  numero_secuencial_diario: string;
};

export type IItemsPedidos = {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  notas?: string;
  tipo?: string;
  opcionesSeleccionadas?: any[];
};

export interface IFacturaPedido {
  id: string;
  factura_id: string;
  pedido_id: string;
  monto_aplicado: number;
  created_at: Date;
  updated_at: Date;
}

export interface IFactura {
  id: string;
  establecimiento_id: string;
  usuario_cajero_id: string;
  tipo_factura: "TOTAL" | "PARCIAL";
  subtotal: number;
  impuestos: number;
  descuentos: number;
  propina: number;
  total_factura: number;
  sales_code: string;
  estado_envio_api: "PENDIENTE" | "ENVIADO" | "FALLIDO";
  pdf_factura_data: string | null;
  error_envio_api: string | null;
  notas: string | null;
  fecha_hora_factura: Date;
  created_at: Date;
  updated_at: Date;
  cierre_caja_id: string | null;
  facturaPedidos: IFacturaPedido[]; // Relación con los pedidos de la factura
}
