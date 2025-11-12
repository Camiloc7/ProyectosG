export const validateSeleccionMultiple = (x: string): boolean => {
  return x.trim() !== '';
};

export const validateTextos = (x: string): boolean => {
  return x.trim() !== '';
};

export const validateEntradasNumericas = (value: string): boolean => {
  return value.trim() !== '' && !isNaN(Number(value)) && Number(value) >= 0;
};
