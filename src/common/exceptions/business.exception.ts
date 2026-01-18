import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    errorCode?: string,
  ) {
    super(
      {
        success: false,
        error: {
          code: errorCode || 'BUSINESS_ERROR',
          message,
        },
      },
      statusCode,
    );
  }
}
