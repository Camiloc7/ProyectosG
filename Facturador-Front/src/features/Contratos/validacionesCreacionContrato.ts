export const validateVacioYMaximo = (value: string, max: number): boolean => {
  // Primero, valida que no esté vacío
  if (value.trim() === '') {
    return false;
  }

  // Luego, valida que sea un número válido
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return false;
  }

  // Finalmente, verifica si el número no excede el máximo
  if (numValue > max) {
    return false; // El número es demasiado grande
  }

  return true; // Es un valor válido
};
