import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: '*',
    methods: process.env.CORS_METHODS || 'GET,POST,PUT,PATCH,DELETE',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  });

  const config = new DocumentBuilder()
    .setTitle('API de Gestión de Inventarios')
    .setDescription('Documentación de la API para el sistema de gestión de inventarios.')
    .setVersion('1.0')
  .addBearerAuth({
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Ingresa tu token JWT con el prefijo "Bearer"',
  },
   'JWT-Auth'
  ) 
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);


  console.log('\x1b[32m%s\x1b[0m', ` Backend corriendo en http://localhost:${port}`);
}
bootstrap();