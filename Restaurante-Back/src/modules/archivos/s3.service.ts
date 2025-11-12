import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  NoSuchKey,
} from '@aws-sdk/client-s3';

import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class S3Service {
  private s3Client: S3Client | null = null; 
  private readonly bucketName: string | null = null; 
  private readonly logger = new Logger(S3Service.name);
  private readonly isS3Configured: boolean; 
  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_S3_REGION');
    const accessKeyId = this.configService.get<string>('AWS_S3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_S3_SECRET_ACCESS_KEY');
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    if (region && accessKeyId && secretAccessKey && bucketName) {
      this.isS3Configured = true;
      this.bucketName = bucketName;
      this.s3Client = new S3Client({
        region: region,
        credentials: {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
        },
      });
      this.logger.log('AWS S3 configurado correctamente. Las operaciones irán a S3.');
    } else {
      this.isS3Configured = false;
      this.logger.warn(
        'Variables de entorno de AWS S3 incompletas. ' +
        'S3Service operará en modo "dummy" (simulación local). ' +
        'Las imágenes NO se subirán ni se descargarán de S3.'
      );
    }
  }

  /**
   * Sube un archivo. Si S3 está configurado, sube a S3. Si no, simula una URL local.
   * @param fileBuffer El contenido del archivo en formato Buffer.
   * @param folder La carpeta virtual (en S3 o para la URL simulada).
   * @param filename El nombre único que tendrá el archivo.
   * @returns La URL (S3 real o simulada localmente).
   */
  async uploadFile(fileBuffer: Buffer, folder: string, filename: string): Promise<string> {
    if (this.isS3Configured && this.s3Client && this.bucketName) {
      const key = `${folder}/${filename}`;
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
      });

      try {
        await this.s3Client.send(command);
        const publicUrl = `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_S3_REGION')}.amazonaws.com/${key}`;
        this.logger.log(`Archivo subido a S3: ${publicUrl}`);
        return publicUrl;
      } catch (error) {
        this.logger.error(`Error al subir archivo a S3: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Error al subir archivo a S3');
      }
    } else {
      const simulatedUrl = `http://localhost:${process.env.PORT || 3002}/archivos/servir/${folder}/${filename}`;
      this.logger.log(`Simulando subida: Se generaría la URL ${simulatedUrl}. (Modo dummy S3)`);
      return simulatedUrl;
    }
  }
  /**
   * Descarga un archivo. Si S3 está configurado, descarga de S3. Si no, lanza NotFound.
   * @param s3Key La clave del objeto en S3.
   * @param localPath La ruta completa donde se guardará localmente.
   */
  async downloadFile(s3Key: string, localPath: string): Promise<void> {
    if (this.isS3Configured && this.s3Client && this.bucketName) {
      this.logger.debug(`Intentando descargar ${s3Key} de S3 a ${localPath}`);
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      try {
        const response = await this.s3Client.send(command);
        if (!response.Body) {
          throw new NotFoundException('Archivo no encontrado en S3');
        }

        const localDir = join(localPath, '..');
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }

        await new Promise<void>((resolve, reject) => {
          const stream = fs.createWriteStream(localPath);
          (response.Body as any).pipe(stream)
            .on('finish', () => {
              this.logger.log(`Archivo descargado y guardado localmente: ${localPath}`);
              resolve();
            })
            .on('error', (err) => {
              this.logger.error(`Error al guardar archivo localmente: ${err.message}`);
              reject(err);
            });
        });
      } catch (error) {
        if (error instanceof NoSuchKey) {
          throw new NotFoundException(`Archivo ${s3Key} no encontrado en S3.`);
        }
        this.logger.error(`Error al descargar archivo de S3: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Error al descargar archivo de S3');
      }
    } else {
      this.logger.warn(`No se puede descargar ${s3Key}. S3 no está configurado. Asumiendo no encontrado.`);
      throw new NotFoundException('Operación de descarga S3 no disponible. S3 no configurado.');
    }
  }

  /**
   * Elimina un archivo. Si S3 está configurado, elimina de S3. Si no, simula.
   * @param s3Key La clave del objeto en S3.
   */
  async deleteFile(s3Key: string): Promise<void> {
    if (this.isS3Configured && this.s3Client && this.bucketName) {
      this.logger.debug(`Intentando eliminar ${s3Key} de S3`);
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      try {
        await this.s3Client.send(command);
        this.logger.log(`Archivo eliminado de S3: ${s3Key}`);
      } catch (error) {
        this.logger.error(`Error al eliminar archivo de S3: ${error.message}`, error.stack);
        throw new InternalServerErrorException('Error al eliminar archivo de S3');
      }
    } else {
      this.logger.warn(`Simulando eliminación de ${s3Key}. (Modo dummy S3)`);
    }
  }
}
