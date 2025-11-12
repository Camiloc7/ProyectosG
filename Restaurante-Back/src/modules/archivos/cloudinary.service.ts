import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import * as fs from 'fs';
import { join } from 'path';
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
    if (
      this.configService.get('CLOUDINARY_CLOUD_NAME') &&
      this.configService.get('CLOUDINARY_API_KEY') &&
      this.configService.get('CLOUDINARY_API_SECRET')
    ) {
      this.logger.log('Cloudinary configurado correctamente.');
    } else {
      this.logger.error('Variables de entorno de Cloudinary incompletas. El servicio no funcionará.');
    }
  }
  async uploadFile(
    fileBuffer: Buffer,
    folder: string,
    filename: string,
  ): Promise<{ publicUrl: string; publicId: string }> {
    try {
      const uploadStream = new Promise<UploadApiResponse | UploadApiErrorResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: folder, public_id: filename.split('.')[0] },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          },
        );
        const bufferStream = new Readable();
        bufferStream.push(fileBuffer);
        bufferStream.push(null);
        bufferStream.pipe(stream);
      });
      const result = await uploadStream;
      if (result.url) {
        this.logger.log(`Archivo subido a Cloudinary: ${result.url}`);
        return { publicUrl: result.secure_url, publicId: result.public_id };
      }
      throw new InternalServerErrorException('Error al subir el archivo a Cloudinary');
    } catch (error) {
      this.logger.error(`Error al subir archivo a Cloudinary: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al subir archivo a Cloudinary');
    }
  }
  async downloadFile(publicId: string, localPath: string): Promise<void> {
    try {
      this.logger.debug(`Intentando descargar ${publicId} de Cloudinary a ${localPath}`);
      const url = cloudinary.url(publicId, { secure: true });
      const { default: fetch } = await import('node-fetch');
      const response = await fetch(url);
      if (!response.ok) {
        throw new NotFoundException(`Archivo ${publicId} no encontrado en Cloudinary.`);
      }
      const localDir = join(localPath, '..');
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      await new Promise<void>((resolve, reject) => {
        const stream = fs.createWriteStream(localPath);
          if (!response.body) {
            reject(new InternalServerErrorException('No se pudo obtener el cuerpo del archivo desde Cloudinary'));
            return;
        }
        response.body.pipe(stream)
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
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al descargar archivo de Cloudinary: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al descargar archivo de Cloudinary');
    }
  }
  async deleteFile(publicId: string): Promise<void> {
    try {
      this.logger.debug(`Intentando eliminar ${publicId} de Cloudinary`);
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result !== 'ok') {
        throw new InternalServerErrorException('Error al eliminar archivo de Cloudinary');
      }
      this.logger.log(`Archivo eliminado de Cloudinary: ${publicId}`);
    } catch (error) {
      this.logger.error(`Error al eliminar archivo de Cloudinary: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al eliminar archivo de Cloudinary');
    }
  }
}