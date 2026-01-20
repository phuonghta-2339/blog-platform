# 📚 Implementation Guides - Quick Start

Welcome to the documentation for the Blog Platform (Medium Clone) project. This documentation provides detailed guidance on implementing each feature following NestJS best practices and Google TypeScript Style Guide.

---

## 🚀 Technology Stack

- **Framework:** NestJS (Node.js)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Validation:** class-validator, class-transformer
- **Configuration:** @nestjs/config with Joi validation
- **Language:** TypeScript

## 📁 Project Structure

```
src/
├── common/                    # Shared infrastructure
│   ├── dto/                   # Data Transfer Objects
│   ├── exceptions/            # Custom exception classes
│   ├── filters/               # Exception filters
│   ├── interceptors/          # Response transformation
│   └── interfaces/            # TypeScript interfaces
├── config/                    # Configuration files
│   └── validation.schema.ts   # Environment validation
├── database/                  # Database setup
│   ├── database.module.ts
│   └── prisma.service.ts
└── modules/                   # Feature modules
```

## 🔧 Installation

### Prerequisites

- Node.js >= 20.x
- Docker & Docker Compose (recommended) OR PostgreSQL >= 14.x
- Yarn or npm

### Option A: Quick Start with Docker (Recommended)

This is the fastest way to get started. Docker will handle PostgreSQL setup automatically.

#### 1. Clone the repository

```bash
git clone <repository-url>
cd blog
```

#### 2. Install dependencies

```bash
yarn install
```

#### 3. Setup environment variables

```bash
# Copy example environment file
cp .env.example .env
```

**Important Environment Variables:**

```env
# Database (defaults work with docker-compose.yml)
DB_USER=blog_user
DB_PASSWORD=blog_password_change_in_production
DB_NAME=blog
DB_HOST=localhost
DB_PORT=5432

# JWT Secret (MUST change in production!)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"

# JWT Refresh Secret (MUST change in production!)
JWT_REFRESH_SECRET="your-super-secret-refresh-token-key-min-32-characters"
```

#### 4. Start PostgreSQL with Docker

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Check container status
docker-compose ps

# View logs
docker-compose logs -f postgres
```

**Docker Compose Features:**

- ✅ PostgreSQL 16 Alpine (lightweight, production-ready)
- ✅ Data persistence via named volumes
- ✅ Health checks for container monitoring
- ✅ Automatic restart on failure
- ✅ Optimized PostgreSQL configuration
- ✅ Network isolation

#### 5. Setup Prisma Database

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed database with sample data
npx prisma db seed
```

#### 6. Run the application

```bash
# Development mode (with hot reload)
yarn start:dev

# Production mode
yarn build
yarn start:prod
```

#### 7. Verify Setup

```bash
# Check application health
curl http://localhost:3000/api/v1/health

# Expected response:
# {
#   "success": true,
#   "data": {
#     "status": "ok",
#     "timestamp": "2026-01-16T10:00:00.000Z",
#     "uptime": 123.456,
#     "environment": "development"
#   }
# }
```

#### 8. Verify Database Setup

**Option A: Prisma Studio (GUI - RECOMMENDED)**

```bash
# Start Prisma Studio (opens in browser)
npx prisma studio

# Access at: http://localhost:5555 (or the displayed port)
# This is a GUI for viewing/editing data directly
```

**Option B: Command Line (Fastest)**

```bash
# View list of tables
docker-compose exec postgres psql -U blog_user -d blog -c "\dt"
```

**Option C: pgAdmin (GUI Alternative)**

```bash
# Start pgAdmin (already included in docker-compose)
docker-compose --profile tools up -d

# Access at: http://localhost:5050
# Login: admin@example.com / admin
```

#### Docker Compose Commands

```bash
# Start services
docker-compose up -d                    # Start in background
docker-compose up                       # Start with logs

# Stop services
docker-compose stop                     # Stop containers (keep data)
docker-compose down                     # Stop and remove containers

# View logs
docker-compose logs -f postgres         # Follow PostgreSQL logs
docker-compose logs --tail=100 postgres # Last 100 lines

# Execute commands in container
docker-compose exec postgres psql -U blog_user -d blog

# Restart services
docker-compose restart postgres

# Remove all data (CAUTION!)
docker-compose down -v                  # Remove volumes (deletes database)
```

---

## 🧪 Testing

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Test coverage
yarn test:cov
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Health Check

**Endpoint:** `GET /api/v1/health`

**Description:** Check API and database health status

**Authentication:** None (Public)

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-01-16T10:00:00.000Z",
    "uptime": 123.456,
    "environment": "development"
  }
}
```

### Standard Response Format

**Success Response:**

```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  },
  "timestamp": "2026-01-16T10:00:00.000Z",
  "path": "/api/v1/endpoint",
  "method": "GET"
}
```

---

## 🛠️ Development Guidelines

### Code Style

- Follow Google TypeScript Style Guide
- Use PascalCase for interfaces
- No `any` types allowed
- Explicit return types required
- JSDoc comments for public APIs

### SOLID Principles

- ✅ Single Responsibility
- ✅ Open/Closed
- ✅ Liskov Substitution
- ✅ Interface Segregation
- ✅ Dependency Inversion

### Best Practices

1. **Exception Handling:** Use custom exceptions, never throw raw errors
2. **Validation:** Always validate DTOs at the controller level
3. **Database:** Use Prisma transactions for multi-step operations
4. **Logging:** Use the Logger service, not console.log
5. **Configuration:** Never hardcode values, use environment variables
6. **Security:** Never commit .env file, always use .env.example
7. **Docker:** Use volumes for data persistence in production
8. **Database:** Regular backups, connection pooling for production

---

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes and test thoroughly
4. Run linting: `yarn lint`
5. Run tests: `yarn test`
6. Commit with meaningful message: `git commit -m "feat: add feature"`
7. Push to branch: `git push origin feature/your-feature`
8. Create Pull Request

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build process or auxiliary tool changes

---

## 🔗 External Resources

### Documentation

- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)

### Tools

- [dbdiagram.io](https://dbdiagram.io) - Visualize ERD
- [Swagger UI](http://localhost:3000/api) - API documentation
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI

---

## 🆘 Troubleshooting

### Common Issues

**Database connection failed:**

```bash
# Check PostgreSQL is running
docker-compose ps

# Restart services
docker-compose restart postgres

# Check DATABASE_URL in .env
```

**Prisma migration failed:**

```bash
# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Or apply migrations manually
npx prisma migrate deploy
```

**Tests failing:**

```bash
# Clean test database
NODE_ENV=test npx prisma migrate reset

# Run tests with verbose output
pnpm test -- --verbose
```

**ESLint errors:**

```bash
# Auto-fix issues
pnpm lint --fix

# Check specific file
pnpm lint src/path/to/file.ts
```

---

## 🎯 Next Steps

1. ✅ Visualize ERD from [database-schema.md](database-schema.md)
2. ✅ Review API spec at [api-specification.md](api-specification.md)
3. ✅ Setup project following [features/00-common-infrastructure.md](features/00-common-infrastructure.md)
4. ✅ Implement authentication following [features/01-authentication.md](features/01-authentication.md)
5. ✅ Continue with Phase 2-7 (Users → Tags → Articles → Comments → Favorites → Follows)

---

**Happy Coding! 🚀**
