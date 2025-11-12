import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Configurar plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

// Configurar idioma español
dayjs.locale('es');

// Configurar zona horaria de Colombia (GMT-5)
dayjs.tz.setDefault('America/Bogota');

export default dayjs;

// Funciones helper para formateo común
// Las fechas ya vienen en GMT-5 desde el servidor, las mostramos tal como vienen
// Removemos la 'Z' para evitar que dayjs las trate como UTC
const parseServerDate = (date: string | Date) => {
  if (typeof date === 'string' && date.endsWith('Z')) {
    // Removemos la 'Z' y tratamos la fecha como GMT-5
    const dateWithoutZ = date.slice(0, -1);
    return dayjs.tz(dateWithoutZ, 'America/Bogota');
  }
  return dayjs.tz(date, 'America/Bogota');
};

export const formatDate = (date: string | Date) => {
  return parseServerDate(date).format('DD/MM/YYYY');
};

export const formatTime = (date: string | Date) => {
  //suma 5 horas
  const timePlus5 = dayjs.tz(date, 'America/Bogota');
    const timeParse =  timePlus5.format('HH:mm');

    return timeParse;
};

export const formatDateTime = (date: string | Date) => {
  return parseServerDate(date).format('DD/MM/YYYY HH:mm');
};

export const formatDateTimeFull = (date: string | Date) => {
  return parseServerDate(date).format('dddd, DD [de] MMMM [de] YYYY [a las] HH:mm');
};

export const getRelativeTime = (date: string | Date) => {
  return parseServerDate(date).fromNow();
};

export const isToday = (date: string | Date) => {
  return parseServerDate(date).isSame(dayjs(), 'day');
};

export const isYesterday = (date: string | Date) => {
  return parseServerDate(date).isSame(dayjs().subtract(1, 'day'), 'day');
};

// Función para obtener la fecha/hora actual en GMT-5
export const nowGMT5 = () => {
  return dayjs.tz(new Date(), 'America/Bogota');
};

// Función para convertir cualquier fecha a GMT-5 (si fuera necesario)
export const toGMT5 = (date: string | Date) => {
  return dayjs.tz(date, 'America/Bogota');
};

// Función para mostrar fechas tal como vienen del servidor (ya en GMT-5)
export const formatServerDate = (date: string | Date) => {
  return parseServerDate(date).format('DD/MM/YYYY HH:mm');
};
