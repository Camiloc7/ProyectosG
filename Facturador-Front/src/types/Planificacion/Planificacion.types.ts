export interface IPDF {
  id: number;
  fechaCreacion: string;
  fechaActualizacion: String;
  codigo: String;
  versionDocumento: number;
  descripcion: String;
  cumplimiento: number;
  urlPdf: String;
  titulo: String;
  secciones: ISectionConfig[];
}

// ---- Interfaces ----
//! ESTE ES la interfaz PRINCIPAL, DE AQUI SE SUJETAN TODas las demas intefaces !//
export type ISectionConfig = {
  id: string;
  poscicion: number;
  sideData: IDatosLado[];
  items: IItemComplex[];
};

export interface IDatosLado {
  id: string;
  label: string;
  value: string;
}

export type IItemComplex = IItemTexto | ItemFirma | IItemImagen | ItemTabla;

export type IItemImagen = {
  id: string;
  tipo: 'imagen';
  poscicion: number;
  data: {
    src: string; // URL o base64
    width: number; // en puntos o porcentaje
    height: number;
    file?: File | null;
    url?: string;
    key?: string;
  };
};

export interface IDataTexto {
  subtitulo: string;
  contenido: string;
}
export interface IDataFirma {
  nombre: string;
  cargo: string;
}
export interface IDataTabla {
  headers: string[];
  rows: Array<string[]>;
  // footer?: string[];
  meta?: { [key: string]: any };
}

export type IItemTexto = {
  id: string;
  poscicion: number;
  tipo: 'texto';
  data: IDataTexto;
};

export type ItemFirma = {
  id: string;
  tipo: 'firma';
  poscicion: number;
  data: IDataFirma;
};

export type ItemTabla = {
  id: string;
  tipo: 'tabla';
  poscicion: number;
  data: IDataTabla;
};

export interface PageEditorProps {
  page: ISectionConfig;
  onChange: (page: ISectionConfig) => void;
}
