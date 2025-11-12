/**
 * Mapa de nombres de ingredientes comunes y sus versiones normalizadas.
 * Las claves deben estar en minúsculas y sin acentos.
 * Los valores deben ser la versión estandarizada que se usará en la base de datos.
 */
const INGREDIENT_NORMALIZATION_MAP = new Map<string, string>([
  // Corrige tildes
  ['azucar', 'azúcar'],
  ['cafe', 'café'],
  ['pina', 'piña'],
  ['limon', 'limón'],
  ['platano', 'plátano'],
  ['anis', 'anís'],
  ['te', 'té'],
  ['pure', 'puré'],
  ['arandanos', 'arándanos'],
  ['pimenton', 'pimentón'],
  ['jitomate', 'tomate'],
  ['azucar moreno', 'azúcar moreno'],

  // Plurales a singular
  ['limones', 'limón'],
  ['cebollas', 'cebolla'],
  ['tomates', 'tomate'],
  ['zanahorias', 'zanahoria'],
  ['papas', 'papa'],
  ['patatas', 'papa'],
  ['ajos', 'ajo'],
  ['huevos', 'huevo'],
  ['leches', 'leche'],
  ['aceites', 'aceite'],
  ['harinas', 'harina'],
  ['panes', 'pan'],
  ['quesos', 'queso'],
  ['pollos', 'pollo'],
  ['carnes', 'carne'],
  ['pescados', 'pescado'],
  ['arroces', 'arroz'],
  ['frijoles', 'frijol'],
  ['lentejas', 'lenteja'],
  ['manzanas', 'manzana'],
  ['bananas', 'banana'],
  ['platanos', 'plátano'],
  ['naranjas', 'naranja'],
  ['uvas', 'uva'],
  ['pepinos', 'pepino'],
  ['lechugas', 'lechuga'],
  ['oregano', 'orégano'],
  ['manzanas', 'manzana'],
  ['naranjas', 'naranja'],
['platanos', 'plátano'],
['bananas', 'banana'],
['peras', 'pera'],
['huevos', 'huevo'],
['zanahorias', 'zanahoria'],
['papas', 'papa'],
['cebollas', 'cebolla'],
['tomates', 'tomate'],
['pepinos', 'pepino'],
['lechugas', 'lechuga'],
['uvas', 'uva'],
['chiles', 'ají'],
['ajies', 'ají'],
['garbanzos', 'garbanzo'],
['lentejas', 'lenteja'],
['almendras', 'almendra'],
['nueces', 'nuez'],
['setas', 'seta'],
['hongos', 'hongo'],



  // Variaciones comunes
  ['jitomate', 'tomate'], 
  ['catsup', 'kétchup'],
  ['ketchup', 'kétchup'],
  ['yogurt', 'yogur'],
  ['banano', 'banana'],

  ['palta', 'aguacate'],
['banano', 'banana'],
['porotos', 'frijol'],
['judias', 'frijol'],
['judías', 'frijol'],
['elote', 'maíz'],
['mazorca', 'maíz'],
['choclo', 'maíz'],
['betabel', 'remolacha'],


  // Errores comunes o simplificaciones
  ['harina trigo', 'harina de trigo'],
  ['harina maiz', 'harina de maíz'],
  ['harina de maiz', 'harina de maíz'],
  ['chile', 'ají'],
  ['chiles', 'ají'],
  ['pimenton', 'pimentón'],
  ['pimentones', 'pimentón'],
  ['mayonesas', 'mayonesa'],
  ['mostazas', 'mostaza'],
  ['salsas soya', 'salsa de soya'],
  ['salsa soya', 'salsa de soya'],
]);

/**
 * Normaliza una cadena de texto para estandarizar nombres de ingredientes.
 * Esto convierte a minúsculas, elimina espacios extra y corrige
 * errores de ortografía comunes basándose en un mapa predefinido.
 * @param text La cadena de texto a normalizar.
 * @returns La cadena de texto normalizada.
 */
export function normalizeIngredientName(text: string): string {
  if (!text) {
    return '';
  }

  const cleanedText = text.trim().toLowerCase();
  const normalized = INGREDIENT_NORMALIZATION_MAP.get(cleanedText);

  // Si se encuentra una versión normalizada, la devuelve.
  // De lo contrario, devuelve el texto limpio.
  return normalized || cleanedText;
}