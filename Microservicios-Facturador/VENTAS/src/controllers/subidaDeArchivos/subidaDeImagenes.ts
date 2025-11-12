import { Request, Response } from "express";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Configuración del cliente de S3
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Configuración de multer (almacena el archivo en memoria para trabajar con él directamente)
export const upload = multer({ storage: multer.memoryStorage() });

export const uploadProductImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({
        status: false,
        message: "No se ha enviado ningún archivo",
      });
      return;
    }

    if (!file.mimetype.startsWith("image/")) {
      res.status(400).json({
        status: false,
        message: "El archivo no es una imagen válida",
      });
      return;
    }

    const uniqueTimestamp = Date.now();
    const key = `facturador/uploads/${uniqueTimestamp}_${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    // Ahora devolvemos el key, no la URL
    res.status(200).json({
      status: true,
      message: "Imagen subida correctamente",
      key: key, // Este key lo guardás en tu DB
    });
  } catch (error) {
    console.error("Error al subir la imagen:", error);
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
      expiresIn: 3600,
    });

    res.status(200).json({
      status: true,
      url: signedUrl,
    });
  } catch (error) {
    console.error("Error al generar URL prefirmada:", error);
    res.status(500).json({
      status: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

export default upload;
