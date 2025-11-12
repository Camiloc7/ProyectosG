import { Role } from "./auth";

export interface Usuario {
  id: string;
  establecimiento_id: string;
  rol_id: string;
  nombre: string;
  apellido: string;
  username: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  establecimiento: Establecimiento;
  rol: Role;
}

export interface Establecimiento {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  logo_url: string;
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
  estado: "LIBRE" | "OCUPADA" | "MANTENIMIENTO";
  created_at: string;
  updated_at: string;
  establecimiento?: Establecimiento;
}

export interface Categoria {
  id: string;
  establecimiento_id: string;
  nombre: string;
  descripcion?: string;
  orden?: number;
  created_at?: string;
  updated_at?: string;
}

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
  categoria: string;
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
