# Feature: Authentication (JWT + Passport.js)

## 📌 Overview

Implement JWT-based authentication system with Passport.js strategies, role-based authorization, and password hashing for secure user authentication and protected routes.

**Cross-Module Dependencies:**

- Hash Utility → Phase 1 (This module)
- Used by → All authenticated endpoints

---

## 🎯 Core Requirements

### Authentication Features

- User registration with email/password validation
- Login with JWT token issuance (7-day expiration)
- Token refresh mechanism
- JWT authentication guard for protected routes
- Role-based authorization (USER, ADMIN)
- Rate limiting on auth endpoints

### Security Requirements

- Bcrypt password hashing (cost factor 10)
- JWT payload: userId, email, username, role, expiration
- 401 responses for invalid/expired tokens
- Refresh token flow for token renewal
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
│   └── utils/
│       └── hash.util.ts           # Password hashing utility
└── modules/
    └── auth/
        ├── dto/                   # Request/response DTOs
        ├── guards/                # Auth and role guards
        ├── strategies/            # Passport strategies
        ├── interfaces/            # JWT payload interface
        ├── auth.controller.ts
        ├── auth.service.ts
        └── auth.module.ts
```

---

## 📋 Implementation Components

### 1. Hash Utility (Common)

- Bcrypt password hashing function (cost factor 10)
- Password comparison function
- Async operations for non-blocking performance
- Reusable across Auth and Users modules

### 2. DTOs & Interfaces

- RegisterDto: email, username, password, bio validation
- LoginDto: email and password validation
- AuthResponseDto: user data + JWT token
- JwtPayload interface: token structure definition

### 3. Passport Strategies

- JwtStrategy: validate JWT tokens from headers
- LocalStrategy: validate email/password credentials
- Strategy configuration with environment variables

### 4. Guards

- JwtAuthGuard: protect routes with JWT validation
- RolesGuard: enforce role-based access control
- Public decorator support for unprotected routes
- Global guard registration

### 5. Auth Service

- User registration with duplicate checks
- Login with credential validation
- Token generation with JWT payload
- Token refresh mechanism
- User validation by ID for strategies

### 6. Auth Controller

- POST /auth/register endpoint
- POST /auth/login endpoint
- POST /auth/refresh endpoint
- Rate limiting on auth endpoints
- Swagger documentation

### 7. Rate Limiting

- ThrottlerModule configuration
- Short: 3 req/min for register
- Medium: 5 req/min for login
- Long: 10 req/min for refresh

---

## ✅ Verification Checklist

### Functionality

- [ ] User can register with valid credentials
- [ ] Duplicate email/username rejected
- [ ] Login returns JWT token
- [ ] Invalid credentials rejected
- [ ] JWT token validates successfully
- [ ] Token refresh works
- [ ] Inactive accounts rejected
- [ ] Role-based access enforced

### Security

- [ ] Passwords hashed with bcrypt
- [ ] JWT secret from environment
- [ ] Token expiration configured (7 days)
- [ ] Rate limiting active on auth endpoints
- [ ] Password complexity enforced
- [ ] Public routes accessible without token

### Integration

- [ ] JWT guard applied globally
- [ ] Public decorator bypasses auth
- [ ] Roles guard checks permissions
- [ ] Current user extracted correctly

---

## 📚 Production Best Practices

**Security:** Bcrypt hashing, JWT expiration, rate limiting, password validation

**Architecture:** Passport strategies, guard-based authorization, global guards

**Validation:** DTO decorators, email format, username pattern, password complexity

**Error Handling:** Meaningful exceptions, 401 for auth errors, 409 for conflicts

**Performance:** Async hashing, token caching, efficient validation

**Documentation:** Swagger decorators, usage examples, security notes

---

## 🚀 Implementation Sequence

1. **Hash Utility** (2h)
   - Create bcrypt functions, add to common/utils

2. **Dependencies** (1h)
   - Install Passport, JWT, Throttler, bcrypt packages

3. **DTOs & Interfaces** (2h)
   - Register, Login, AuthResponse DTOs, JwtPayload interface

4. **Strategies** (3h)
   - JWT and Local strategies with validation

5. **Guards** (2h)
   - JwtAuthGuard, RolesGuard, public route support

6. **Auth Service** (4h)
   - Register, login, refresh, validation logic

7. **Auth Controller** (2h)
   - Endpoints, rate limiting, Swagger docs

8. **Module Configuration** (2h)
   - Wire up providers, global guards, JWT config

9. **Testing** (6h)
   - Unit tests for service and guards, E2E tests

**Total:** ~24 hours (3 days)

**Next Phase:** Users Management

---

**Status:** Ready for Implementation
**Dependencies:** Phase 0 (Common Infrastructure)
**Estimated Time:** 3 days (24 hours)
**Test Coverage Target:** > 85%

**Production-Ready Features:**

- ✅ JWT authentication with Passport.js
- ✅ Bcrypt password hashing
- ✅ Role-based authorization
- ✅ Rate limiting on auth endpoints
- ✅ Token refresh mechanism
- ✅ Global authentication guards
- ✅ Comprehensive validation
- ✅ Swagger documentation
