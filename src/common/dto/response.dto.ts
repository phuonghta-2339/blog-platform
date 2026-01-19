import { ApiProperty } from '@nestjs/swagger';

/**
 * Base Success Response Wrapper
 * All successful API responses follow this format
 */
export class BaseResponseDto<T> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
    type: Boolean,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Response data payload',
  })
  data!: T;
}

/**
 * Welcome Message Response DTO
 */
export class WelcomeResponseDto {
  @ApiProperty({
    description: 'Welcome message from the API',
    example: 'Hello World!',
  })
  message!: string;
}
