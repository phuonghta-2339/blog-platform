# Feature: Users Management

## 📌 Overview

Implement CRU operations for user profile management with custom decorators for authentication, soft delete with isActive flag, and public profile viewing.

**Cross-Module Dependencies:**

- Custom Decorators → Phase 2 (This module)
- Used by → All authenticated endpoints

---

## 🎯 Core Requirements

### User Management Features

- Get current user profile (GET /user) - authenticated
- Update current user profile (PUT /user) - authenticated
- Get public profile by username (GET /profiles/:username) - public
- Soft delete using isActive flag (no hard delete)
- Password hashing when updating password
- Username uniqueness validation

### Data Requirements

- Unique username and email (database constraints)
- Bcrypt password hashing (cost factor 10)
- Avatar stored as URL (S3 upload TODO for later)
- Bio text field (max 500 characters, optional)
- Soft delete via isActive boolean

### Authorization Rules

- **USER:** Can read and update own profile only
- **PUBLIC:** Can view public profiles (username, bio, avatar, stats)
- **No Admin operations** (will add later if needed)

### Performance

- Cache public profiles (TTL 5 minutes)
- Index on username for fast lookup
- Following status checked in batch queries

---

## 🏗️ Module Structure

```text
src/
├── common/
│   ├── cache/
│   │   ├── cache.config.ts             # CacheKeys patterns
│   │   └── cache.module.ts             # Global cache (no local imports needed)
│   ├── constants/
│   │   └── cache.ts                    # CACHE_TTL constants (SHORT, MEDIUM, etc.)
│   └── decorators/                     # Already exists from auth module
│       ├── current-user.decorator.ts   # Extract authenticated user
│       ├── public.decorator.ts         # Mark public routes
│       └── roles.decorator.ts          # Role-based access
└── modules/
    └── users/
        ├── dto/                        # Update, response DTOs
        │   ├── update-user.dto.ts
        │   ├── user-response.dto.ts
        │   └── public-profile.dto.ts
        ├── users.controller.ts         # /user endpoints (authenticated)
        ├── profiles.controller.ts      # /profiles/:username (public)
        ├── users.service.ts
        └── users.module.ts
```

**Note:**

- No barrel exports (index.ts) - import directly from files
- Two-controller pattern: UsersController + ProfilesController
- CacheModule is Global - no local imports needed

### Import Path Conventions

**Absolute Paths** (cross-module imports):

```typescript
// From users module importing auth decorators
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Public } from '@modules/auth/decorators/public.decorator';
import { Roles } from '@modules/auth/decorators/roles.decorator';
```

**Relative Paths** (within same module):

```typescript
// Within users module
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';
```

---

## 📋 Implementation Components

### 1. Custom Decorators (Common)

- CurrentUser: extract user from request (full object or specific property)
- Public: mark endpoints as accessible without authentication
- Roles: specify required roles for endpoint access
- Used globally across all authenticated modules

### 2. DTOs

- UpdateUserDto: optional email, username, password, bio, avatar
- UserResponseDto: exclude password, transform to client format
- PublicProfileDto: username, bio, avatar, following status, stats

### 3. Users Service

**Core Methods:**

- `getProfile()`: Find user by ID, cache with CACHE_TTL.SHORT (60s)
- `updateProfile()`: Validate uniqueness, hash password, invalidate caches
- `getPublicProfile()`: Find by username, cache with CACHE_TTL.MEDIUM (5min)
- Helper methods: findById, findByEmail, findByUsername

**Key Implementation Points:**

- CACHE_MANAGER injection (global, no local import)
- Cache invalidation with old username handling
- Prisma error handling (P2002 for unique constraints)
- Two-controller pattern for separation of concerns

### 4. Users Controller

**Two Controllers:**

- **UsersController** (@Controller('user')): GET /user, PUT /user (authenticated)
- **ProfilesController** (@Controller('profiles')): GET /profiles/:username (public with @Public())

**Configuration:**

- Use @ApiTags for Swagger grouping
- No @Throttle() needed (global throttle)
- @CurrentUser() decorator for authenticated requests

### 5. Caching Strategy

**Module Configuration:**

- Import DatabaseModule only (CacheModule is global)
- Export UsersService for other modules

**Cache Implementation:**

- Inject CACHE_MANAGER (no local import)
- Authenticated profiles: CACHE_TTL.SHORT (60s)
- Public profiles: CACHE_TTL.MEDIUM (5min) with CacheKeys.userProfile()
- Invalidate on update with old username handling

### 7. Avatar Upload (TODO)

- S3 integration for image storage
- Image validation and resizing
- POST /user/avatar endpoint
- Will implement in future phase

---

## ✅ Verification Checklist

### Functionality

- [ ] GET /user returns authenticated user profile
- [ ] GET /user requires valid JWT token
- [ ] PUT /user updates username successfully
- [ ] PUT /user updates bio and avatar
- [ ] PUT /user hashes password before saving
- [ ] PUT /user validates duplicate username
- [ ] GET /profiles/:username returns public profile
- [ ] GET /profiles/:username accessible without auth
- [ ] Following status shown in public profiles

### Data Integrity

- [ ] Username uniqueness enforced
- [ ] Email uniqueness enforced
- [ ] Password never returned in responses
- [ ] Inactive users cannot authenticate

### Performance

- [ ] Public profiles cached with CACHE_TTL.MEDIUM (5 min)
- [ ] Authenticated profiles cached with CACHE_TTL.SHORT (60s)
- [ ] Username lookups use database index
- [ ] Cache invalidation on profile update

---

## 📚 Production Best Practices

- **Security**: Password hashing (bcrypt cost 10), soft delete with isActive, input validation, username pattern enforcement
- **Architecture**: Two-controller pattern (UsersController + ProfilesController), service layer separation, DTO transformations with class-transformer, Global CacheModule (no local imports)
- **Caching**: CACHE_TTL constants from `@/common/constants/cache`, CacheKeys patterns from `@/common/cache/cache.config`, cache invalidation on updates with old username handling
- **Validation**: Email format validation, username pattern, bio length (max 500), duplicate checks with Prisma error handling (P2002)
- **Error Handling**: NotFoundException for missing users, BadRequestException for validation errors, Prisma constraint errors with specific field identification
- **Performance**: Global cache with CACHE_MANAGER injection, indexed queries on username, efficient DB queries with \_count aggregation
- **Documentation**: Swagger decorators, usage examples with actual code patterns, TODO markers for future features (S3 avatar upload)

---

## 🚀 Implementation Sequence

1. **Custom Decorators** (2h)
   - CurrentUser, Public, Roles decorators in common/

2. **DTOs** (2h)
   - UpdateUserDto, UserResponseDto, PublicProfileDto

3. **Users Service** (4h)
   - CRUD methods, validation, profile mapping

4. **Users Controller** (2h)
   - GET /user, PUT /user, GET /profiles/:username

5. **Module Configuration** (1h)
   - Wire up FollowsModule dependency

6. **Caching** (2h)
   - Redis/memory cache for public profiles

7. **Testing** (5h)
   - Unit tests, E2E tests, integration with auth

**Total:** ~18 hours (2.2 days)

**Next Phase:** Tags Management

---

**Status:** Ready for Implementation
**Dependencies:** Phase 1 (Authentication)
**Estimated Time:** 2.2 days (18 hours)
**Test Coverage Target:** > 85%

**Production-Ready Features:**

- ✅ CRU operations for user profiles
- ✅ Custom decorators for auth
- ✅ Soft delete with isActive
- ✅ Public profile viewing
- ✅ Password hashing on update
- ✅ Profile caching
- ✅ Following status integration
- 🔜 Avatar upload (S3 - TODO)
