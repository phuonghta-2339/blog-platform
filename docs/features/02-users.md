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
│   └── decorators/
│       ├── current-user.decorator.ts   # Extract authenticated user
│       ├── public.decorator.ts         # Mark public routes
│       └── roles.decorator.ts          # Role-based access
└── modules/
    └── users/
        ├── dto/                        # Update, response DTOs
        ├── users.controller.ts
        ├── users.service.ts
        └── users.module.ts
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

- getProfile: find user by ID, throw NotFoundException if not found
- updateProfile: validate uniqueness, hash password if changed
- getPublicProfile: find by username, include following status
- findById/findByEmail/findByUsername: helper methods

### 4. Users Controller

- GET /user: current authenticated user profile
- PUT /user: update current user profile
- GET /profiles/:username: public profile view
- Swagger documentation with examples

### 5. Avatar Upload (TODO)

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

- [ ] Public profiles cached (5 min TTL)
- [ ] Username lookups use index
- [ ] Batch following status checks

---

## 📚 Production Best Practices

**Security:** Password hashing, soft delete, input validation, username pattern

**Architecture:** Custom decorators, service layer separation, DTO transformations

**Validation:** Email format, username pattern, bio length, duplicate checks

**Error Handling:** NotFoundException for missing users, ConflictException for duplicates

**Performance:** Caching public profiles, indexed queries, batch checks

**Documentation:** Swagger decorators, usage examples, TODO for future features

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
