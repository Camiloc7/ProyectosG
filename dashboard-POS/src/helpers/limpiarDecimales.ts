export function limpiarDecimalesCero(data: any): any {
  const copia = JSON.parse(JSON.stringify(data));
  if (typeof copia.precio === "string" && copia.precio.endsWith(".00")) {
    copia.precio = copia.precio.replace(".00", "");
  }
  if (Array.isArray(copia.receta)) {
    copia.receta = copia.receta.map((r: any) => {
      if (
        typeof r.cantidad_necesaria === "string" &&
        r.cantidad_necesaria.endsWith(".00")
      ) {
        r.cantidad_necesaria = r.cantidad_necesaria.replace(".00", "");
      }
      return r;
    });
  }

  return copia;
}
