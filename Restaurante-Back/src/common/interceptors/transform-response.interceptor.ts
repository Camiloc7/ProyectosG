import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  private readonly errorMessages: Record<number, string> = {
    [HttpStatus.FORBIDDEN]: 'No tienes permisos para realizar esta acción.',
    [HttpStatus.UNAUTHORIZED]: 'No estás autenticado. Por favor, inicia sesión.',
    [HttpStatus.NOT_FOUND]: 'El recurso solicitado no fue encontrado.',
    [HttpStatus.BAD_REQUEST]: 'Hay un error en los datos enviados.',
    [HttpStatus.CONFLICT]: 'Ya existe un recurso con esta información.',
    [HttpStatus.INTERNAL_SERVER_ERROR]: 'Ha ocurrido un error inesperado en el servidor.',
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        if (
          typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          'data' in data
        ) {
          return {
            status: true,
            message: data.message,
            data: data.data,
          };
        }

        return {
          status: true,
          message: 'Operación exitosa',
          data: data,
        };
      }),
      catchError(err => {
        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Ha ocurrido un error inesperado';
        let errors = null;

        if (err instanceof HttpException) {
          statusCode = err.getStatus();
          const response = err.getResponse();
          
          if (
            typeof response === 'object' &&
            response !== null &&
            'message' in response &&
            'errors' in response &&
            response.message === 'Algunos ingredientes no pudieron ser procesados.'
          ) {
            return throwError(() => ({
              status: false,
              message: response.message,
              statusCode,
              data: null,
              errors: response.errors,
            }));
          }
          
          let rawMessage: any = '';

          if (typeof response === 'string') {
            rawMessage = response;
          } else if (typeof response === 'object' && response !== null) {
            const res = response as any;
            rawMessage = res.message || rawMessage;

            if (Array.isArray(res.message)) {
              errors = res.message;
              rawMessage = res.message.join(' - ');
            }
          }
          const genericMessages = ['Forbidden resource', 'Unauthorized', 'Not Found', 'Bad Request', 'Conflict'];
          if (
            !rawMessage ||
            genericMessages.includes(rawMessage)
          ) {
            message = this.errorMessages[statusCode] || message;
          } else {
            message = rawMessage;
          }
        } else if (err instanceof Error) {
          message = err.message;
        }

        console.error(`[${new Date().toISOString()}] Error ${statusCode}: ${message}`);
        console.error(err.stack);

        return throwError(() => ({
          status: false,
          message,
          statusCode,
          data: null,
          errors,
        }));
      }),
    );
  }
}
