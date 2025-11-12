import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
  Get,
  Param,
  Res,
  NotFoundException,
  Delete,
  Logger,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { Response } from 'express';
import { CloudinaryService } from './cloudinary.service';
import { RoleName } from 'src/common/constants/app.constants';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

const LOCAL_CACHE_BASE_DIR = join(process.cwd(), 'uploads_cache');

@ApiTags('Archivos')
@Controller('archivos')
export class ArchivosController {
  private readonly logger = new Logger(ArchivosController.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {
    if (!fs.existsSync(LOCAL_CACHE_BASE_DIR)) {
      fs.mkdirSync(LOCAL_CACHE_BASE_DIR, { recursive: true });
      this.logger.log(`Directorio de caché local creado: ${LOCAL_CACHE_BASE_DIR}`);
    }
  }

  @Post('subir/:folder')
  @ApiBearerAuth('JWT-auth') 
  @UseGuards(AuthGuard, RolesGuard) 
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Subir un archivo a Cloudinary',
    description: 'Sube un archivo de imagen a la carpeta especificada en Cloudinary. La URL pública y el nombre del archivo se devuelven.',
  })
  @ApiResponse({
    status: 201,
    description: 'Archivo subido exitosamente a Cloudinary',
    schema: {
      type: 'object',
      properties: {
        filename: { type: 'string', example: 'mi-imagen-uuid.jpg' },
        publicUrl: { type: 'string', example: 'https://res.cloudinary.com/tu_cloud_name/image/upload/v12345/categorias/mi-imagen-uuid' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Archivo inválido (tipo o tamaño).' })
  @ApiResponse({ status: 401, description: 'No autorizado, token JWT inválido o inexistente.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado, el rol del usuario no tiene permisos.' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'folder',
    description: 'Nombre de la carpeta de destino en Cloudinary (ej. "categorias", "productos").',
    type: 'string',
  })
  @ApiBody({
    description: 'Archivo a subir (máx 5MB, solo imágenes JPG, PNG, GIF, WEBP).',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(new BadRequestException(`Tipo de archivo inválido. Solo se permiten imágenes JPG, PNG, GIF, WEBP.`), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
            message: 'El archivo es demasiado grande (máx 5MB)',
          }),
        ],
        fileIsRequired: true,
      }),
    ) file: Express.Multer.File,
    @Param('folder') folder: string,
  ) {
    const uniqueSuffix = uuidv4();
    const fileExt = file.originalname.split('.').pop();
    const filename = `${uniqueSuffix}.${fileExt}`;
    const { publicUrl } = await this.cloudinaryService.uploadFile(file.buffer, folder, uniqueSuffix);
    const localCachePath = join(LOCAL_CACHE_BASE_DIR, folder, filename);
    const localCacheDir = join(localCachePath, '..');

    if (!fs.existsSync(localCacheDir)) {
      fs.mkdirSync(localCacheDir, { recursive: true });
    }
    fs.writeFileSync(localCachePath, file.buffer);
    this.logger.debug(`Archivo guardado en caché local después de subir a Cloudinary: ${localCachePath}`);

    return { filename, publicUrl };
  }

  @Get('servir/:folder/:filename')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener un archivo (primero caché local, luego Cloudinary)',
    description: 'Intenta servir un archivo desde la caché local. Si no lo encuentra, lo descarga de Cloudinary a la caché y luego lo sirve. Esta ruta es pública y no requiere autenticación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo encontrado y devuelto.',
  })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado.' })
  @ApiParam({
    name: 'folder',
    description: 'Carpeta del archivo (ej. "categorias").',
    type: 'string',
  })
  @ApiParam({
    name: 'filename',
    description: 'Nombre completo del archivo (ej. "mi-uuid.jpg").',
    type: 'string',
  })
  async serveFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const localFilePath = join(LOCAL_CACHE_BASE_DIR, folder, filename);
    const publicId = `${folder}/${filename.split('.')[0]}`;

    if (fs.existsSync(localFilePath)) {
      this.logger.debug(`Sirviendo archivo desde caché local: ${localFilePath}`);
      return res.sendFile(localFilePath);
    }

    this.logger.debug(`Archivo no encontrado en caché local, intentando descargar de Cloudinary: ${publicId}`);
    try {
      await this.cloudinaryService.downloadFile(publicId, localFilePath);
      this.logger.debug(`Archivo descargado de Cloudinary y sirviendo desde local: ${localFilePath}`);
      return res.sendFile(localFilePath);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`Archivo no encontrado en Cloudinary: ${publicId}`);
        throw new NotFoundException('Archivo no encontrado');
      }
      this.logger.error(`Error al servir/descargar archivo: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al procesar la solicitud del archivo');
    }
  }

  @Delete('eliminar/:folder/:filename')
  @ApiBearerAuth('JWT-auth') 
  @UseGuards(AuthGuard, RolesGuard) 
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un archivo de Cloudinary y la caché local',
    description: 'Elimina un archivo de imagen de Cloudinary y también de la caché local si existe. Solo los roles ADMIN y SUPERVISOR pueden realizar esta acción.',
  })
  @ApiResponse({
    status: 204,
    description: 'Archivo eliminado exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado.' })
  @ApiResponse({ status: 401, description: 'No autorizado, token JWT inválido o inexistente.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado, el rol del usuario no tiene permisos.' })
  @ApiParam({
    name: 'folder',
    description: 'Carpeta del archivo en Cloudinary y caché local.',
    type: 'string',
  })
  @ApiParam({
    name: 'filename',
    description: 'Nombre completo del archivo (incluyendo extensión).',
    type: 'string',
  })
  async deleteFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
  ) {
    const publicId = `${folder}/${filename.split('.')[0]}`;
    const localFilePath = join(LOCAL_CACHE_BASE_DIR, folder, filename);
    await this.cloudinaryService.deleteFile(publicId);

    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
        this.logger.log(`Archivo eliminado de caché local: ${localFilePath}`);
      } catch (error) {
        this.logger.warn(`No se pudo eliminar el archivo de la caché local: ${localFilePath}. Error: ${error.message}`);
      }
    }
  }
}
