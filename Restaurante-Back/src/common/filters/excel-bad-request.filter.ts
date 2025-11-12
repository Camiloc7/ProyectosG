import { Catch, ArgumentsHost, ExceptionFilter, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ExcelBadRequestFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'errors' in exceptionResponse) {
      response.status(status).json({
        statusCode: status,
        message: exceptionResponse['message'],
        errors: exceptionResponse['errors'],
      });
    } else {
      response.status(status).json(exceptionResponse);
    }
  }
}