import imageCompression from "browser-image-compression";

export const compressImage = async (
  file: File,
  maxSizeMB = 2
): Promise<File> => {
  // Opciones de compresión/redimensionado
  const options = {
    maxSizeMB, // tamaño máximo en MB
    maxWidthOrHeight: 1920, // ancho/alto máximo en px
    useWebWorker: true, // usa Web Worker para no bloquear UI
    initialQuality: 0.8, // calidad inicial (0.0 – 1.0)
  };
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.warn("La compresión falló, enviando original:", error);
    return file; // fallback
  }
};
