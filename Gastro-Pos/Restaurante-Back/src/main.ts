import './common/patches/sqlite-patch';
import './common/patches/typeorm-safe-results';
import './common/polyfills/crypto';
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import { TransformResponseInterceptor } from "./common/interceptors/transform-response.interceptor";
import { ConfigService } from '@nestjs/config'; 

async function bootstrap() {
  console.log('--- Iniciando aplicación NestJS ---');
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    const configService = app.get(ConfigService); 
    const corsOrigin = configService.get<string>('CORS_ORIGIN') || 'https://gastro-pos.netlify.app,http://localhost:3000'; 
    const corsMethods = configService.get<string>('CORS_METHODS') || 'GET,HEAD,PUT,PATCH,POST,DELETE';

    app.enableCors({
    /*  origin: corsOrigin.split(',').map(s => s.trim()), 
      methods: corsMethods.split(',').map(s => s.trim()), 
      credentials: false, 
      allowedHeaders: 'Content-Type,Authorization', */
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        }, 
      })
    );

    app.useGlobalInterceptors(new TransformResponseInterceptor());

    const config = new DocumentBuilder()
      .setTitle("API de Sistema POS")
      .setDescription("Documentación de la API del Sistema de Punto de Venta")
      .setVersion("1.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "JWT",
          description: "Introduce tu token JWT",
          in: "header",
        },
        "JWT-auth"
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);

    const port = process.env.PORT || 3002;
    await app.listen(port);
    console.log(`Aplicación ejecutándose en: ${await app.getUrl()}`);
    // process.stdin.setRawMode(true);
    // process.stdin.resume();
    // process.stdin.on('data', process.exit.bind(process, 0));
  } catch (error) {
    console.error('--- ERROR CRÍTICO AL INICIAR LA APLICACIÓN ---');
    console.error(error);
  }
}
bootstrap();
