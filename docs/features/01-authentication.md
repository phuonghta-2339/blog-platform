# Feature: Authentication (JWT + Passport.js)

## 📌 Overview

Implement JWT-based authentication system with Passport.js strategies, role-based authorization, and password hashing for secure user authentication and protected routes.

**Cross-Module Dependencies:**

- Hash Utility → Phase 1 (This module)
- Used by → All authenticated endpoints

---

## 🎯 Core Requirements

### Authentication Features

- User registration with email/password validation + password confirmation
- Login with JWT token issuance (1h access token, 7d refresh token)
- Token refresh mechanism with dedicated refresh token endpoint
- JWT authentication guard for protected routes (global guard)
- Role-based authorization (USER, ADMIN) via RolesGuard
- Global rate limiting with three levels (short/medium/long)

### Security Requirements

- Bcrypt password hashing (cost factor 10) - directly in AuthService
- JWT payload: sub (userId), email, username, role, isActive
- JWT refresh token with separate secret and longer expiration
- 401 responses for invalid/expired tokens
- Stateless JWT validation (no DB query for access tokens)
- Refresh token validates against DB for user status
- Request rate limiting to prevent brute force

### Authorization Rules

- **PUBLIC:** Can register and login
- **AUTHENTICATED:** Access protected routes with valid JWT
- **ROLE-BASED:** Specific roles required for admin operations

---

## 🏗️ Module Structure

```text
src/
├── common/
│   ├── dto/                       # Common DTOs (pagination, response)
│   ├── exceptions/                # Custom exceptions
│   ├── filters/                   # Exception filters
│   └── interceptors/              # Response transformers
├── config/
│   └── app.config.ts              # JWT secrets and expiration config
└── modules/
    └── auth/
        ├── constants/
        │   └── regex.ts           # Username & password regex patterns
        ├── decorators/            # Custom decorators
        │   ├── api-auth.decorator.ts      # Swagger API docs
        │   ├── current-user.decorator.ts  # Extract user from request
        │   ├── match.decorator.ts         # Field matching validator
        │   ├── public.decorator.ts        # Skip JWT auth
        │   └── roles.decorator.ts         # Role-based access
        ├── dto/                   # Request/response DTOs
        │   ├── auth-response.dto.ts       # Login/Register response
        │   ├── login.dto.ts               # Login request
        │   ├── refresh-token.dto.ts       # Refresh request
        │   ├── refresh-token-response.dto.ts  # Refresh response
        │   └── register.dto.ts            # Registration with confirmation
        ├── guards/                # Auth and role guards
        │   ├── jwt-auth.guard.ts          # JWT validation guard
        │   ├── jwt-refresh-auth.guard.ts  # Refresh token guard
        │   ├── local-auth.guard.ts        # Login credentials guard
        │   └── roles.guard.ts             # Role-based access guard
        ├── interfaces/            # TypeScript interfaces
        │   ├── authenticated-user.interface.ts  # User in request
        │   ├── jwt-payload.interface.ts         # JWT payload structure
        │   └── user-for-token.interface.ts      # User data for token
        ├── strategies/            # Passport strategies
        │   ├── jwt.strategy.ts            # Access token validation
        │   ├── jwt-refresh.strategy.ts    # Refresh token validation
        │   └── local.strategy.ts          # Email/password validation
        ├── auth.controller.ts
        ├── auth.service.ts
        └── auth.module.ts
```

**Note:** Hash utility is NOT implemented as separate file - bcrypt is used directly in AuthService.

---

## 📋 Implementation Components

### 1. Configuration (app.config.ts)

- JWT_SECRET and JWT_REFRESH_SECRET validation (fail-fast on missing)
- Default access token expiration: 1 hour
- Default refresh token expiration: 7 days
- Configurable via environment variables
- Centralized in app configuration

### 2. DTOs & Interfaces

**DTOs:**

- **RegisterDto**: email, username, password, passwordConfirmation with @Match decorator
- **LoginDto**: email and password validation
- **RefreshTokenDto**: refreshToken with @IsJWT validation
- **AuthResponseDto**: user data + access token + refresh token
- **RefreshTokenResponseDto**: token + refreshToken only (no user data)

**Interfaces:**

- **JwtPayload**: sub, email, username, role, isActive (extends Record<string, unknown>)
- **AuthenticatedUser**: User object attached to request after JWT validation
- **UserForToken**: Minimal user data required for token generation

### 3. Passport Strategies

- **JwtStrategy**: Validates access tokens from Authorization header (stateless)
- **JwtRefreshStrategy**: Validates refresh tokens from request body with DB check
- **LocalStrategy**: Validates email/password credentials for login

### 4. Guards

- **JwtAuthGuard**: Global guard protecting all routes (respects @Public)
- **JwtRefreshAuthGuard**: Used on refresh endpoint
- **LocalAuthGuard**: Used on login endpoint
- **RolesGuard**: Global guard for role-based access control

### 5. Decorators

- **@Public()**: Marks routes as public (bypass JWT auth)
- **@Roles()**: Restricts route access to specific roles
- **@CurrentUser()**: Extracts authenticated user from request
- **@Match()**: Custom validator for field matching (passwordConfirmation)
- **@ApiRegister(), @ApiLogin(), @ApiRefreshToken()**: Swagger documentation

### 6. Auth Service

- **register()**: Creates user, hashes password, generates tokens
- **login()**: Generates tokens for validated user
- **refresh()**: Generates new token pair
- **validateUser()**: Validates credentials and account status
- **Private helpers**: mapUserToDto, createJwtPayload, generateToken, generateRefreshToken

### 7. Auth Controller

- **POST /auth/register**: Public endpoint, returns user + tokens
- **POST /auth/login**: Public + LocalAuthGuard, throttled 5 req/min
- **POST /auth/refresh**: Public + JwtRefreshAuthGuard, returns new tokens

### 8. Rate Limiting

- **Global config**: short (3/min), medium (10/min), long (100/15min)
- **Per-endpoint**: Login has custom throttle (5 req/min)
- **ThrottlerGuard**: Registered as global guard

---

## ✅ Verification Checklist

### Functionality

- [ ] User can register with valid credentials (including password confirmation)
- [ ] Duplicate email/username rejected with specific error messages
- [ ] Login returns JWT access token + refresh token
- [ ] Invalid credentials rejected
- [ ] JWT access token validates successfully (stateless)
- [ ] Token refresh works with refresh token from body
- [ ] Inactive accounts rejected (validated in JWT payload and refresh strategy)
- [ ] Role-based access enforced via RolesGuard

### Security

- [ ] Passwords hashed with bcrypt (cost factor 10, directly in service)
- [ ] JWT secret and refresh secret from environment (fail-fast validation)
- [ ] Access token expiration configured (default 1h)
- [ ] Refresh token expiration configured (default 7d)
- [ ] Rate limiting active (global + per-endpoint)
- [ ] Password complexity enforced (uppercase, lowercase, dig t)
- [ ] Password confirmation matches password
- [ ] Public routes accessible without token (@Public decorator)

### Integration

- [ ] JWT guard applied globally (APP_GUARD in app.module.ts)
- [ ] Throttler guard applied globally
- [ ] Public decorator bypasses JWT auth
- [ ] Roles guard checks permissions
- [ ] Current user extracted correctly via @CurrentUser decorator
- [ ] Refresh token uses separate secret and strategy
- [ ] Swagger documentation via custom decorators

---

## 📚 Production Best Practices

- **Security**: Bcrypt hashing, JWT secrets validation, stateless access tokens, refresh token with DB validation, rate limiting, password complexity
- **Architecture**: Passport strategies, global guards (APP_GUARD), custom decorators, type-safe interfaces, OAuth2-compliant token flow
- **Validation**: DTO decorators, email/username/password validation, custom validators (@Match, @IsJWT)
- **Error Handling**: Meaningful exceptions (401/403/400), specific error messages for constraints
- **Performance**: Async operations, stateless validation, efficient DB queries
- **Documentation**: Swagger decorators, inline comments, TypeScript interfaces

---

## 🚀 Implementation Sequence

**Components to Implement:**

1. Setup Configuration & Install Dependencies (JWT secrets, Passport packages, bcrypt)
2. Create Constants & Regex (username/password patterns)
3. Define Interfaces (JwtPayload, AuthenticatedUser, UserForToken)
4. Create DTOs (Register, Login, Refresh, Auth responses)
5. Implement Custom Decorators (@Public, @Roles, @CurrentUser, @Match, Swagger)
6. Implement Passport Strategies (JWT, JWT Refresh, Local)
7. Implement Guards (JWT Auth, JWT Refresh Auth, Local Auth, Roles)
8. Implement Auth Service (register, login, refresh, validateUser)
9. Implement Auth Controller (3 endpoints: register, login, refresh)
10. Configure Rate Limiting (global throttler + per-endpoint)
11. Wire Module (AuthModule + register global guards)

**Estimated Time:** ~24 hours (3 days) | **Next Phase:** Users Management

---

## 📊 Implementation Summary

**Dependencies:** Phase 0 (Common Infrastructure) | **Estimated Time:** 24 hours (3 days) | **Test Coverage Target:** > 85%

**Features to Implement:**

- JWT authentication (access 1h + refresh 7d tokens)
- Bcrypt password hashing (cost 10)
- Role-based authorization (USER, ADMIN)
- Global guards (JWT, Throttler, Roles)
- Password confirmation validation
- Stateless access token validation
- Custom decorators (@Public, @Roles, @CurrentUser, @Match)
- Three-tier rate limiting
- Swagger documentation
