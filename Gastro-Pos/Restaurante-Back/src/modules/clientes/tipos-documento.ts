
export enum TipoDocumento {
  RC = 'RC', 
  TI = 'TI', 
  CC = 'CC', 
  TE = 'TE', 
  CE = 'CE', 
  NIT = 'NIT', 
  PASAPORTE = 'PASAPORTE', 
  DIE = 'DIE', 
  NIT_OTRO_PAIS = 'NIT_OTRO_PAIS', 
  NUIP = 'NUIP', 
}

export const DOCUMENTO_TYPES = [
  { id: '3', nombre: 'Cédula de ciudadanía', codigo: '13', enum: TipoDocumento.CC },
  { id: '6', nombre: 'NIT', codigo: '31', enum: TipoDocumento.NIT },
  { id: '1', nombre: 'Registro civil', codigo: '11', enum: TipoDocumento.RC },
  { id: '2', nombre: 'Tarjeta de identidad', codigo: '12', enum: TipoDocumento.TI },
  { id: '4', nombre: 'Tarjeta de extranjería', codigo: '21', enum: TipoDocumento.TE },
  { id: '5', nombre: 'Cédula de extranjería', codigo: '22', enum: TipoDocumento.CE },
  { id: '7', nombre: 'Pasaporte', codigo: '41', enum: TipoDocumento.PASAPORTE },
  { id: '8', nombre: 'Documento de identificación extranjero', codigo: '42', enum: TipoDocumento.DIE },
  { id: '9', nombre: 'NIT de otro país', codigo: '50', enum: TipoDocumento.NIT_OTRO_PAIS },
  { id: '10', nombre: 'NUIP *', codigo: '91', enum: TipoDocumento.NUIP },
];