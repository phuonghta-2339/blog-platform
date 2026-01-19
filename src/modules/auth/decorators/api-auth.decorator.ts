import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenResponseDto } from '../dto/refresh-token-response.dto';
import { RegisterDto } from '../dto/register.dto';

export const ApiRegister = (): MethodDecorator & ClassDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Register a new user account',
      description:
        'Creates a new user account with email, username, password and password confirmation. Returns user data and JWT token.',
    }),
    ApiBody({ type: RegisterDto }),
    ApiCreatedResponse({
      description: 'User successfully registered',
      type: AuthResponseDto,
      schema: {
        example: {
          success: true,
          data: {
            user: {
              id: 1,
              email: 'user@example.com',
              username: 'johndoe',
              bio: null,
              avatar: null,
              role: 'USER',
              createdAt: '2026-01-19T10:30:00.000Z',
            },
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description:
        'Validation failed (passwords do not match, email already exists, or username already taken)',
      schema: {
        examples: {
          passwordMismatch: {
            summary: 'Passwords do not match',
            value: {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Passwords do not match',
              },
            },
          },
          emailExists: {
            summary: 'Email already registered',
            value: {
              success: false,
              error: {
                code: 'EMAIL_EXISTS',
                message: 'Email already registered',
              },
            },
          },
          usernameTaken: {
            summary: 'Username already taken',
            value: {
              success: false,
              error: {
                code: 'USERNAME_TAKEN',
                message: 'Username already taken',
              },
            },
          },
        },
      },
    }),
    ApiTooManyRequestsResponse({
      description: 'Rate limit exceeded (3 requests per minute)',
      schema: {
        example: {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Rate limit exceeded. Please try again later.',
          },
        },
      },
    }),
  );
};

export const ApiLogin = (): MethodDecorator & ClassDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Login with email and password',
      description:
        'Authenticates user with email and password. Returns user data and JWT token.',
    }),
    ApiBody({ type: LoginDto }),
    ApiOkResponse({
      description: 'User successfully logged in',
      type: AuthResponseDto,
      schema: {
        example: {
          success: true,
          data: {
            user: {
              id: 1,
              email: 'user@example.com',
              username: 'johndoe',
              bio: 'Software developer',
              avatar: 'https://example.com/avatar.jpg',
              role: 'USER',
              createdAt: '2026-01-19T10:30:00.000Z',
            },
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid credentials or account inactive',
      schema: {
        example: {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        },
      },
    }),
    ApiTooManyRequestsResponse({
      description: 'Rate limit exceeded (5 requests per minute)',
      schema: {
        example: {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Rate limit exceeded. Please try again later.',
          },
        },
      },
    }),
  );
};

export const ApiRefreshToken = (): MethodDecorator & ClassDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh JWT access token',
      description:
        'Generates a new JWT token using the current valid token. Requires authentication.',
    }),
    ApiBearerAuth(),
    ApiOkResponse({
      description: 'Token successfully refreshed',
      type: RefreshTokenResponseDto,
      schema: {
        example: {
          success: true,
          data: {
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Invalid or expired token',
      schema: {
        example: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired token',
          },
        },
      },
    }),
    ApiTooManyRequestsResponse({
      description: 'Rate limit exceeded (3 requests per minute)',
      schema: {
        example: {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Rate limit exceeded. Please try again later.',
          },
        },
      },
    }),
  );
};
