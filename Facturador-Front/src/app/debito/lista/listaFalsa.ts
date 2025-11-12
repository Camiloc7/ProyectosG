interface Nota {
  id: string;
  prefijo: string;
  consecutivo: number;
  fecha: string;
  ver: string;
  anular: string;
  xml: string;
  enviar: string;
  nit: string; // Se agrega la propiedad 'nit'
}

const initialNotas: Nota[] = [
  {
    id: '1',
    prefijo: 'ABC',
    consecutivo: 123,
    fecha: '2024-11-20',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '1234567890', // NIT falso
  },
  {
    id: '2',
    prefijo: 'DEF',
    consecutivo: 456,
    fecha: '2024-11-18',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '9876543210', // NIT falso
  },
  {
    id: '3',
    prefijo: 'XYZ',
    consecutivo: 789,
    fecha: '2024-11-22',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '1122334455', // NIT falso
  },
  {
    id: '4',
    prefijo: 'ABC',
    consecutivo: 123,
    fecha: '2024-11-20',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'Borrar este',
    enviar: 'Enviar',
    nit: '6677889900', // NIT falso
  },
  {
    id: '5',
    prefijo: 'DEF',
    consecutivo: 456,
    fecha: '2024-11-18',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '5544332211', // NIT falso
  },
  {
    id: '6',
    prefijo: 'XYZ',
    consecutivo: 789,
    fecha: '2024-11-22',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '9988776655', // NIT falso
  },
  {
    id: '7',
    prefijo: 'ABC',
    consecutivo: 123,
    fecha: '2024-11-20',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '6677884411', // NIT falso
  },
  {
    id: '8',
    prefijo: 'DEF',
    consecutivo: 456,
    fecha: '2024-11-18',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '7766554433', // NIT falso
  },
  {
    id: '9',
    prefijo: 'XYZ',
    consecutivo: 789,
    fecha: '2024-11-22',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '2233445566', // NIT falso
  },
  {
    id: '10',
    prefijo: 'ABC',
    consecutivo: 123,
    fecha: '2024-11-20',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '5544332211', // NIT falso
  },
  {
    id: '11',
    prefijo: 'DEF',
    consecutivo: 456,
    fecha: '2024-11-18',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '9988776655', // NIT falso
  },
  {
    id: '12',
    prefijo: 'XYZ',
    consecutivo: 789,
    fecha: '2024-11-22',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '1122334455', // NIT falso
  },
  {
    id: '13',
    prefijo: 'ABC',
    consecutivo: 123,
    fecha: '2024-11-20',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '6677889900', // NIT falso
  },
  {
    id: '14',
    prefijo: 'DEF',
    consecutivo: 456,
    fecha: '2024-11-18',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '2233445566', // NIT falso
  },
  {
    id: '15',
    prefijo: 'XYZ',
    consecutivo: 789,
    fecha: '2024-11-22',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '5544332211', // NIT falso
  },
  {
    id: '16',
    prefijo: 'ABC',
    consecutivo: 123,
    fecha: '2024-11-20',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '9988776655', // NIT falso
  },
  {
    id: '17',
    prefijo: 'DEF',
    consecutivo: 456,
    fecha: '2024-11-18',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '2233445566', // NIT falso
  },
  {
    id: '18',
    prefijo: 'XYZ',
    consecutivo: 789,
    fecha: '2024-11-22',
    ver: 'Ver',
    anular: 'Eliminar',
    xml: 'XML',
    enviar: 'Enviar',
    nit: '1122334455', // NIT falso
  },
];

export default initialNotas;
