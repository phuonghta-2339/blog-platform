import { ApiProperty } from '@nestjs/swagger';

/**
 * Health Check Response DTO
 * Used for documenting the health check endpoint response
 */
export class HealthCheckResponseDto {
  @ApiProperty({
    description: 'Health status of the application',
    example: 'ok',
    enum: ['ok', 'error'],
  })
  status!: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp of the health check',
    example: '2026-01-16T10:00:00.000Z',
    type: String,
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Application uptime in seconds',
    example: 123.456,
    type: Number,
  })
  uptime!: number;

  @ApiProperty({
    description: 'Current environment (development, staging, production)',
    example: 'development',
    enum: ['development', 'staging', 'production', 'test'],
  })
  environment!: string;
}
