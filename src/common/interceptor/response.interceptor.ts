import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<{
    success: boolean;
    message: string;
    data: unknown;
    meta?: unknown;
  }> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in data) {
          return data as {
            success: boolean;
            message: string;
            data: unknown;
            meta?: unknown;
          };
        }

        const message =
          data && typeof data === 'object' && 'message' in data
            ? (data as { message: string }).message
            : 'Success';

        const payload =
          data && typeof data === 'object' && 'data' in data
            ? (data as { data: unknown }).data
            : data;

        const meta =
          data && typeof data === 'object' && 'meta' in data
            ? (data as { meta?: unknown }).meta
            : null;

        const response = {
          success: true,
          message,
          data: payload,
          ...(meta !== null ? { meta } : {}),
        };

        return response;
      }),
    );
  }
}
