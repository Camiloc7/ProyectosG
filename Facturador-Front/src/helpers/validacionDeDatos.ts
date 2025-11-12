// Función para validar fechas
export const validateDate = (dateString: any) => {
  if (
    typeof dateString === 'string' &&
    dateString.match(/^\d{4}-\d{2}-\d{2}$/)
  ) {
    return dateString; // Retorna la fecha si es válida
  }
  return ''; // Retorna una cadena vacía si no es válida
};

// Función para validar números
export const validateNumber = (value: any) => {
  const numberValue = parseFloat(value);
  return !isNaN(numberValue) ? numberValue : 0; // Retorna el número o 0 si no es válido
};
