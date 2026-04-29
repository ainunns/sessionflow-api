import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = this.getStatus(exception);

    const { message, errors } = this.normalizeError(exception, status);

    response.status(status).json({
      success: false,
      message,
      errors,
    });
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private normalizeError(
    exception: unknown,
    status: number,
  ): { message: string | string[]; errors: unknown } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      this.logger.error('Response', response);
      if (typeof response === 'string') {
        return { message: response, errors: [] };
      }

      const resp = response as {
        message?: string | string[];
        error?: string;
        errors?: unknown;
      };

      const message =
        Array.isArray(resp.message) && resp.message.length > 0
          ? resp.message[0]
          : (resp.message ?? resp.error ?? exception.message);

      const errors =
        resp.errors ??
        (Array.isArray(resp.message) ? resp.message : (resp.message ?? []));

      return { message, errors };
    }

    this.logger.error('Unhandled exception', (exception as Error)?.stack);
    return {
      message: 'Internal server error',
      errors: status === HttpStatus.INTERNAL_SERVER_ERROR ? [] : {},
    };
  }
}
