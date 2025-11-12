import { Request, Response } from "express";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

// Configuración del cliente de S3
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Configuración de multer (almacena el archivo en memoria para trabajar con él directamente)
export const upload = multer({ storage: multer.memoryStorage() });

export const uploadProductImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1. Validaciones básicas
    const file = req.file;
    const token = res.locals.token;
    const { id_empresa: usuarioID, nit } = req.user as any;

    if (!usuarioID) {
      throw new Error("Usuario no autenticado.");
    }
    if (!token) {
      throw new Error("Falta token de autenticación.");
    }
    if (!file) {
      res.status(400).json({
        status: false,
        message: "No se ha enviado ningún archivo.",
      });
      return;
    }
    if (!file.mimetype.startsWith("image/")) {
      res.status(400).json({
        status: false,
        message: "El archivo no es una imagen válida.",
      });
      return;
    }

    if (!nit) {
      throw new Error("La info de usuario no contiene NIT.");
    }

    // 2. Construir el key igual que la segunda función, usando un prefijo fijo
    const uniqueTimestamp = Date.now();
    const key = `facturador/uploads/${uniqueTimestamp}_${file.originalname}`;

    // 3. Comando para subir el objeto a S3
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    await s3Client.send(command);

    // 4. Respuesta al cliente
    res.status(200).json({
      status: true,
      message: "Imagen subida correctamente",
      key: key,
      // key: "ESTA ES LA KEY",
    });
    // console.log("Se subio una imagen siu");
  } catch (error: any) {
    console.error("Error en uploadProductImage:", error);
    res.status(500).json({
      status: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

export const getSignedImageUrl = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    if (!key) {
      res.status(400).json({
        status: false,
        message: "Falta el parámetro 'key'",
      });
      return;
    }

    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hora
    });

    res.status(200).json({
      status: true,
      url: signedUrl,
      // url: "URL FIRMADA",
    });
  } catch (error) {
    console.error("Error al generar URL prefirmada:", error);
    res.status(500).json({
      status: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

export const deleteImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { key } = req.body;
    console.log("Llego");
    console.log("key", key);
    if (!key) {
      res.status(400).json({
        status: false,
        message: "Falta el parámetro 'key'.",
      });
      return;
    }

    // Construye el comando de eliminación
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: key,
    });

    // Envía el comando a S3
    await s3Client.send(deleteCommand);

    res.status(200).json({
      status: true,
      message: "Imagen eliminada correctamente.",
    });
  } catch (error: any) {
    console.error("Error al eliminar la imagen:", error);
    res.status(500).json({
      status: false,
      message: error instanceof Error ? error.message : "Error desconocido.",
    });
  }
};

export default upload;
