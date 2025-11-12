export interface FormData {
  factura: string;
  valor: string;
  cantidad: string;
  acta: string;
  contrato: string;
  descripcionDelContrato: string;
  descripcion: string;
  cliente: string;
  fecha: string;
  tipoDeNegociacion: string;
  vencimiento: string;
  observaciones: string;
  plazo: string;
  porcentajeSobreUtilidad: string;
  porcentajeDeAdministracion: string;
  ivaChecked: boolean;
  IVASobreUtilidad: string;
  adminChecked: boolean;
  adminValue: string;
  imprevistosChecked: boolean;
  imprevistos: string;
  retencionIvaChecked: boolean;
  retencionIva: string;
  retefuenteChecked: boolean;
  retefuente: string;
  reteicaChecked: boolean;
  retegarantiaChecked: boolean;
  anticipoChecked: boolean;
  reteica: string;
  retegarantia: string;
  anticipo: string;
  otrosDescuentosChecked: boolean;
  tipoDeFactura: string;
  resolucion: string;
  medioDePago: string;
  tipoDeOperacion: string;
  deseaCopiar: string;
}

export interface Errors {
  factura: boolean;
  valor: boolean;
  cantidad: boolean;
  acta: boolean;
  contrato: boolean;
  cliente: boolean;
  descripcionDelContrato: boolean;
  descripcion: boolean;
  observaciones: boolean;
  IVASobreUtilidad: boolean;
  porcentajeSobreUtilidad: boolean;
  porcentajeDeAdministracion: boolean;
  tipoDeNegociacion: boolean;
  items: boolean;
  plazo: boolean;
  imprevistos: boolean;
  retencionIva: boolean;
  retefuente: boolean;
  reteica: boolean;
  retegarantia: boolean;
  anticipo: boolean;
}

export interface Item {
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
}

export interface InfoClientes {
  id: string;
  cliente: string;
  correo: string;
  codigo: string;
  pais: string;
  telefono: string;
  tipoDeDocumento: string;
  dv: string;
  tipoDeOrganizacion: string;
  notificaciones: string;
  direccion: string;
  responsabilidadesFiscales: string;
  tipoDeContribuyente: string;
  departamento: string;
  municipio: string;
  documento: string;
}

export interface InfoListaPagos {
  anulado: string;
  contingencia: string;
  estado: string;
  fecha: string;
  numeroDefactura: string;
  xml: string;
  consecutivo: string;
  contrato: string;
  pagada: string;
  pdfFactura: string;
  prefijo: string;
  [key: string]: string;
}

export interface FormTarjeta {
  nombreDeTarjeta: string;
  numeroDeTarjeta: string;
  CVC: string;
  mesExp: string;
  añoExp: string;
}

export interface FormPasarelaDePagos {
  tipoDeDocumento: string;
  documento: string;
}
interface PlanDetails {
  id_plan: string;
  nombrePlan: string;
  covertura: string[];
  precioPlan: number;
  Moneda: string;
  Intervalo: string;
  Estado: string;
  dias_prueba: number;
  created: string;
}

interface DataPlanes {
  mypime: {
    monthly: PlanDetails;
    annual: PlanDetails;
  };
  pro: {
    monthly: PlanDetails;
    annual: PlanDetails;
  };
  ejecutivo: {
    monthly: PlanDetails;
    annual: PlanDetails;
  };
}

export interface todaLaInfoUsuario {
  id?: string;
  idRol?: string;
  nombreUsuario?: string;
  usuario?: string;
  password?: string;
  nombre?: string;
  nit?: string;
  fechaRegistro?: string;
  fechaVencimiento?: string;
  limiteDeFacturacion?: string;
  limiteDisponible?: string;
  montoFacturado?: string;
  regimen?: string;
  resolucion?: string;
  ciudad?: string;
  resolucione?: string;
  fechaResolucion?: string;
  fechaResolucion1?: string;
  fechaResolucion2?: string;
  fechaResolucionC?: string;
  actividadEconomica?: string;
  facturaDesde?: string;
  facturaHasta?: string;
  prefijoe?: string;
  facturaDesdeE?: string;
  facturaHastaE?: string;
  resolucionC?: string;
  prefijoC?: string;
  facturaDesdeC?: string;
  facturaHastaC?: string;
  responsabilidad?: string;
  ica?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  correoAlt?: string;
  prefijo?: string;
  imagen?: string;
  imagen2?: string;
  conteoFactura?: string;
  conteoFactura2?: string;
  renovacion?: string;
  constructor?: string;
  recredito?: string;
  recredito2?: string;
  numCredito?: string;
  membrete?: string;
  membrete2?: string;
  consecutivoPago?: string;
  tipoUsuario?: string;
  per1?: string;
  responsabilidadTri?: string;
  tipoCon?: string;
  pais?: string;
  departamento?: string;
  municipio?: string;
  ciiu?: string;
  nomActividad?: string;
  entidad?: string;
  tipoCuenta?: string;
  noCuenta?: string;
  tipoDocEntidad?: string;
  identidad?: string;
  testid?: string;
  fechaCamara?: string;
  tsociedad?: string;
  fechaCons?: string;
  representante?: string;
  tipoPersona?: string;
  dv?: string;
  tipoDoc?: string;
  conteoCarta?: string;
  tokenApi?: string;
  softwareId?: string;
  fechaDeRegistro?: string;
  softwareCode?: string;
  claveTecnica?: string;
  registroMercantil?: string;
  typeEnvironmentId?: string;
  tipoDeOrganizacion?: string;
  nombreEmpresa?: string;
}

export interface NotaCredito {
  id: string;
  numeroFactura: string;
  fecha: string;
  consecutivo: string;
  xml: string;
  valor: string;
  idResolucion: string;
  prefijoNotaCredito: string;
  rutaXml: string;
  rutaPdf: string;
  rutaCausativo: string;
  estado: string;
  anulado: string;
}

export interface InformeDataExel {
  fechaInicial1: string;
  fechaInicial2: string;
  fechaFinal1: string;
  fechaFinal2: string;
}

export interface InformeDataPDF {
  fechaInicial: string;
  fechaFinal: string;
}

export interface InfoRepresentante {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  tipoDeDocumento: string;
  numeroDeDocumento: string;
  fechaDeExpedicion: string;
  fechaDeNacimiento: string;
  nacionalidad1: string;
  nacionalidad2: string;
  correo: string;
  direccion: string;
  departamento: string;
  municipio: string;
  telefono: string;
  lugarDeExpedicion: string;
  lugarDeNacimiento: string;
  cedulaRL: File | null;
  certificadoCC: File | null;
  rut: File | null;
  fechaCertificado: string;
  fechaVencimientoCertificado: string;
  cedulaRLURL: string;
  certificadoCCURL: string;
  rutURL: string;
}

export interface InfoFirma {
  id: string;
  idUsuario: string;
  idRepresentante: string;
  fechaCertificado: string;
  fechaVencimientoCertificado: string;
  rutaCertificado: string;
}

export interface NotaDebito {
  id: string;
  numeroFactura: string;
  fecha: string;
  consecutivo: string;
  xml: string;
  valor: string;
  idResolucion: string;
  prefijoNotaDebito: string;
  rutaXml: string;
  rutaPdf: string;
  rutaCausativo: string;
  estado: string;
  anulado: string;
}

export interface ListaDeContratos {
  id: string;
  idUsuario: string;
  contrato: string;
  descripcion: string;
  porcentajeUtilidad: string;
  ciudad: string;
  retefuente: string;
  reteica: string;
  administracion: string;
  imprevistos: string;
  retegarantia: string;
  utilidad: string;
  fechaInicio: string;
  fechaFin: string;
  valorInicial: string;
  otro1: string;
  otro2: string;
  otro3: string;
  otro4: string;
  otro5: string;
  valorEjecutado: string;
  fic: string;
  numero: string;
  disminucion: string;
  valorFinal: string;
  correoObra: string;
  constructora: string;
  reteGarantia: string;
  indicador: string;
  idCliente: string;
  valor: string;
  //
}

export interface Review {
  calificacion: number;
  comentario: string;
  idUsuario: string;
  nombre?: string; // Si 'nombre' es opcional
  id: string;
}

export interface ReviewState {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface InfoProveedor {
  status?: 'enviando' | 'procesado' | 'completado';

  id: string;
  nombre: string;
  nit: string;
  tipoDeDocumento: string;
  direccion: string;
  correo: string;
  telefono: string;
  ciudad: string;
  FIC: string;
  nombre1: string;
  nombre2: string;
  apellido1: string;
  apellido2: string;
  dv: string;
  nombreE: string;
  tipocuenta: string;
  numeroc: string;
  bancos: string;
  notificacion: string;
}

export type SelectOption =
  | string
  | { id: string; nombre: string }
  | { label: string; value: string };

export interface TooltipProps {
  text: string;
}

export interface ItemsVenta {
  codigo: number | null;
  idUsuario: number | null;
  descripcion: string;
  subtotal: number | null;
  unidadMedidaCodigo: number | null;
  porcentajeIva: number | null;
  iva: number | null;
  total: number | null;
  retefuente: number | null;
  reteica: number | null;
  urlImagen: string;
  descuentoVenta: number | null;
  idCategoria: number | null;
}

export interface ItemsVentaFront {
  descripcion: string;
  subtotal: number | null;
  unidadDeMedida: string;
  porcentajeIva: number | null;
  iva: number | null;
  total: number;
  retefuente: string;
  tarifaIca: string;
  reteica: number;
  descuentoVenta: number | null;
  cantidad: number | null;
  idCategoria: number | null;
  codigo: number | null;
  imagen: File | null;
  urlImagen?: string;
  id?: string;
}
export interface Retefuentes {
  id: number;
  concepto: string;
  baseMinimaPesos: number;
  porcentaje: number;
}
export interface UsuarioAdmin {
  id: string;
  correo: string;
  nit: string;
  activo: string;
  nombre: string;
  telefono: string;
  imagen: string;
  rol: string;
  administradoresAsignados: string[];
}
