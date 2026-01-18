# Feature: Common Infrastructure & Foundation

## 📌 Overview

Establish production-ready infrastructure foundation for the blog application with PostgreSQL, Prisma v7, global exception handling, validation pipeline, and standardized API responses.

**Cross-Module Dependencies:**

- Custom Decorators → Phase 2 (Users)
- Common Utilities → Phase 4 (Articles)

---

## 🎯 Core Requirements

### Database & Configuration

- PostgreSQL 16 with Docker Compose setup
- Prisma v7 with PostgreSQL adapter and connection pooling
- Environment variable validation with Joi schema
- Global database module with lifecycle management

### Exception Handling

- Custom exception classes (BusinessException, NotFoundException)
- Global HTTP exception filter with structured error responses
- Prisma-specific exception filter for database errors (P2002, P2025, P2003)
- Consistent error format with timestamps and request context

### Validation & Transformation

- Global ValidationPipe with whitelist and transform enabled
- Global Transform Interceptor for response standardization
- DTO validation with class-validator decorators
- Automatic type conversion for query parameters

### API Standards

- Base response interface with success flag and data
- Paginated response with metadata (total, limit, offset, hasNext, hasPrev)
- Swagger/OpenAPI documentation with proper decorators
- Health check endpoint with database status

---

## 🏗️ Module Structure

```text
src/
├── common/
│   ├── dto/                    # Shared DTOs
│   ├── exceptions/             # Custom exceptions
│   ├── filters/                # Exception filters
│   ├── interceptors/           # Response transformers
│   └── interfaces/             # TypeScript interfaces
├── config/                     # Configuration modules
└── database/                   # Prisma service
```

**Later Additions:**

- `common/guards/` → Phase 1
- `common/decorators/` → Phase 2
- `common/utils/` → Phase 4

---

## 📋 Implementation Components

### 1. Docker & PostgreSQL Setup

- Docker Compose with PostgreSQL 16 + pgAdmin
- Volume persistence and health checks
- Helper scripts (start, stop, reset)
- Environment configuration

### 2. Project Foundation

- NestJS initialization with TypeScript strict mode
- Prisma v7 with PostgreSQL adapter
- Environment validation with Joi
- Path aliases configuration

### 3. Database Layer

- PrismaService with lifecycle hooks
- Connection pooling configuration
- Query logging for development
- Global DatabaseModule

### 4. Exception Infrastructure

- BusinessException, NotFoundException classes
- HttpExceptionFilter with logging
- PrismaExceptionFilter for DB errors (P2002, P2025, P2003)
- Structured error responses

### 5. Validation & Transformation

- Global ValidationPipe with whitelist
- Transform Interceptor for responses
- PaginationDto and BaseResponse interfaces
- Automatic type conversion

### 6. API Documentation

- Swagger UI at /api/docs
- JWT Bearer authentication setup
- Health check endpoints
- Comprehensive @ApiProperty decorators

---

## ✅ Verification Checklist

### Infrastructure

- [ ] PostgreSQL running in Docker
- [ ] Prisma migrations applied
- [ ] Environment variables validated
- [ ] Health endpoint returns 200

### Exception Handling

- [ ] HTTP exceptions formatted correctly
- [ ] Prisma errors mapped to proper HTTP codes
- [ ] 404 errors don't spam logs

### API Standards

- [ ] Responses wrapped with success flag
- [ ] Validation rejects invalid DTOs
- [ ] Swagger UI accessible at /api/docs
- [ ] CORS enabled for configured origins

---

## 📚 Production Best Practices

**TypeScript:** Strict mode, explicit types, no `any`

**NestJS:** Dependency injection, modular architecture, global providers

**Database:** Connection pooling, lifecycle management, query logging

**Error Handling:** Structured responses, proper HTTP codes, filtered logging

**Validation:** Whitelist input, transform types, reject unknown properties

**Documentation:** Swagger for all endpoints, examples, authentication schemes

---

## 🚀 Implementation Sequence

1. **Docker + PostgreSQL** (2h)
   - Compose file, helper scripts, verification

2. **NestJS + Prisma** (6h)
   - Project init, dependencies, database connection

3. **Exception Handling** (4h)
   - Custom exceptions, global filters

4. **Response Transform** (3h)
   - Interfaces, interceptor, pagination

5. **Validation** (2h)
   - Global pipe, CORS, main.ts setup

6. **Swagger** (2h)
   - Configuration, health endpoints, decorators

**Total:** ~20 hours (2.5 days)

**Next Phase:** Authentication Module

---

**Status:** Ready for Implementation
**Dependencies:** Docker, PostgreSQL 16+
**Estimated Time:** 3-4 days (18-24 hours)
**Test Coverage Target:** > 85%

**Production-Ready Features:**

- ✅ Docker Compose for local development
- ✅ PostgreSQL 16 with connection pooling
- ✅ Prisma v7 with PostgreSQL adapter
- ✅ Swagger/OpenAPI documentation
- ✅ Global exception handling
- ✅ Request/Response validation
- ✅ Health check endpoints
- ✅ pgAdmin for database management
