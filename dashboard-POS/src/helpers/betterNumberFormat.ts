export function formatearNumero(valor: number | string): string {
  const numero = Number(valor);
  if (isNaN(numero)) return "0.00";

  return numero.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
