// import {
//     Catch,
//     ArgumentsHost,
//     HttpException,
//     HttpStatus,
//     ExceptionFilter,
//   } from '@nestjs/common';
//   import { Request, Response } from 'express';
//   @Catch()
//   export class AllExceptionsFilter implements ExceptionFilter {
//     catch(exception: unknown, host: ArgumentsHost) {
//       const ctx = host.switchToHttp();
//       const response = ctx.getResponse<Response>();
//       const request = ctx.getRequest<Request>();
//       let status = HttpStatus.INTERNAL_SERVER_ERROR;
//       let message = 'Ha ocurrido un error inesperado';
//       let data: any = null;
//       let errors: string[] | object | null = null;
//       if (exception instanceof HttpException) {
//         status = exception.getStatus();
//         const errorResponse = exception.getResponse();
//         if (typeof errorResponse === 'string') {
//           message = errorResponse;
//         } else if (typeof errorResponse === 'object' && errorResponse !== null) {
//           const errorResponseMessage = (errorResponse as any).message;
//           if (typeof errorResponseMessage === 'string') {
//             message = errorResponseMessage;
//           }
//           else if (Array.isArray(errorResponseMessage)) {
//             errors = errorResponseMessage; 
//             message = `Error de ${status} - ${request.method} ${request.url}`;
//           }
//           else if ((errorResponse as any).error && typeof (errorResponse as any).error === 'string') {
//             message = (errorResponse as any).error; 
//           }
//         }
//       } else if (exception instanceof Error) {
//         message = exception.message;
//         console.error(exception); 
//       }
//       response
//         .status(status)
//         .json({
//           status: false,
//           message: message,
//           statusCode: status,
//           data: data,
//           errors: errors,
//         });
//     }
//   }