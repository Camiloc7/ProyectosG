// import { v4 as uuidv4 } from "uuid";
// import {
//   S3Client,
//   GetObjectCommand,
//   PutObjectCommand,
//   DeleteObjectCommand,
// } from "@aws-sdk/client-s3";

// const s3Client = new S3Client({ region: process.env.AWS_REGION! });

// const allowedExtensions = ["jpg", "jpeg", "png", "webp"];

// export const uploadImage = async (
//   file: Express.Multer.File
// ): Promise<string> => {
//   const ext = file.originalname.split(".").pop()?.toLowerCase();

//   if (!ext || !allowedExtensions.includes(ext)) {
//     throw new Error("Extensión de imagen no permitida");
//   }

//   const key = `productos/${uuidv4()}.${ext}`;

//   const command = new PutObjectCommand({
//     Bucket: process.env.AWS_BUCKET!,
//     Key: key,
//     Body: file.buffer,
//     ContentType: file.mimetype,
//     ACL: "public-read",
//   });

//   await s3Client.send(command);

//   return key;
// };

// export const deleteImage = async (imageKey: string): Promise<void> => {
//   try {
//     const command = new DeleteObjectCommand({
//       Bucket: process.env.AWS_BUCKET!,
//       Key: imageKey,
//     });

//     await s3Client.send(command);
//   } catch (error) {
//     console.error("Error al eliminar la imagen de S3:", error);
//     throw error; // Opcional, dependiendo de tu manejo de errores
//   }
// };
