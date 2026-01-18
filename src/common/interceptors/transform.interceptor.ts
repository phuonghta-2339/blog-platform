import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseResponse } from '../interfaces/base-response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  BaseResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<BaseResponse<T>> {
    return next.handle().pipe(
      map((data: unknown) => {
        // If data already has success property, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data as BaseResponse<T>;
        }

        // Otherwise wrap in standard response
        return {
          success: true,
          data: data as T,
        };
      }),
    );
  }
}
