# Feature: Follows Management

## 📌 Overview

Implement follow/unfollow operations with self-follow prevention, denormalized counts, pagination for followers/following lists, and feed integration for followed users' articles.

**Cross-Module Dependencies:**

- Used by → Articles feed, Users profiles (following status)
- Depends on → Users module

---

## 🎯 Core Requirements

### Follow Operations

- Follow user (POST /profiles/:username/follow) - authenticated
- Unfollow user (DELETE /profiles/:username/follow) - authenticated
- List followers (GET /profiles/:username/followers) - authenticated with pagination
- List following (GET /profiles/:username/following) - authenticated with pagination
- Cannot follow yourself (enforced at service level)
- Idempotent operations (safe retries)

### Data Requirements

- Many-to-many relationship (User ↔ User)
- Composite unique key (followerId, followingId)
- Optional denormalized counts in User profile (followersCount, followingCount)
- Timestamps for follow creation

### Authorization Rules

- **USER:** Can follow/unfollow any user except self
- **USER:** Can view followers/following lists (authenticated)
- **Authenticated:** Required for all follow operations

### Performance

- Composite unique index for fast lookups
- Pagination for followers/following lists
- Batch check for following status
- Efficient feed queries (articles from followed users)

---

## 🏗️ Module Structure

```text
src/
├── common/
│   ├── cache/
│   │   ├── cache.config.ts             # CacheKeys patterns
│   │   └── cache.module.ts             # Global cache (no local imports needed)
│   └── constants/
│       └── cache.ts                    # CACHE_TTL constants
└── modules/follows/
├── dto/
│   ├── follow-response.dto.ts
│   ├── profile.dto.ts
│   └── follow-list-query.dto.ts
├── follows.controller.ts
├── follows.service.ts
└── follows.module.ts
```

**Note:** No barrel exports (index.ts) - import directly from files

### Import Path Conventions

**Absolute Paths** (cross-module imports):

```typescript
// From follows module importing from other modules
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UsersService } from '@modules/users/users.service';
```

**Relative Paths** (within same module):

```typescript
// Within follows module
import { FollowResponseDto } from './dto/follow-response.dto';
import { FollowsService } from './follows.service';
```

---

## 📋 Implementation Components

### 1. DTOs

- FollowResponseDto: profile data after follow/unfollow
- ProfileDto: username, bio, avatar, following status
- FollowListQueryDto: pagination and sorting for lists

### 2. Follows Service

**Core Methods:**

- `followUser()`: Idempotent follow with self-follow prevention, transaction for counts (optional)
- `unfollowUser()`: Idempotent unfollow with transaction for counts (optional)
- `getFollowers()`: Paginated list with profiles and following status
- `getFollowing()`: Paginated list with profiles
- `isFollowing()`: Single following status check (boolean)
- `batchCheckFollowing()`: Batch status check (avoid N+1)
- `getFollowedUserIds()`: IDs array for feed queries

**Key Implementation Points:**

- Prevent self-follow (BadRequestException)
- Idempotent operations (check existence before create/delete)
- Transaction for follow + denormalized counts (followersCount, followingCount)
- Cache invalidation after follow/unfollow
- Batch checks for performance

### 2.1. Caching Strategy (Optional)

**Caching Strategy:**

- Inject CACHE_MANAGER (global, no local import)
- Followers/following lists: CACHE_TTL.MEDIUM (5 min)
- Following status: CACHE_TTL.SHORT (60s)
- Followed user IDs: CACHE_TTL.MEDIUM (5 min)
- Invalidate caches on follow/unfollow

### 3. Follows Controller

**Endpoints:**

- POST /profiles/:username/follow - Follow user (authenticated)
- DELETE /profiles/:username/follow - Unfollow (authenticated)
- GET /profiles/:username/followers - List followers (authenticated, paginated)
- GET /profiles/:username/following - List following (authenticated, paginated)
- Use @ApiTags('follows'), @Controller('profiles/:username')

### 4. Integration Points

- Users.getPublicProfile: include following status
- Articles.getFeed: filter by followed user IDs
- Comments/Articles: show following status for authors

---

## ✅ Verification Checklist

### Operations

- [ ] Follow/unfollow are idempotent
- [ ] Self-follow rejected with error
- [ ] Following status shown in profiles
- [ ] Followers/following lists paginated
- [ ] Feed shows only followed users' articles

### Data Integrity

- [ ] Composite unique key prevents duplicates
- [ ] Batch checks efficient (no N+1)
- [ ] Following status accurate across modules

---

## 📚 Production Best Practices

- **Self-follow prevention**: Validate followerId !== followingId
- **Idempotency**: Check existence before create/delete, no errors on duplicates
- **Composite unique key**: (followerId, followingId) at database level
- **Transaction safety**: Atomic follow + count updates (optional, counts can be calculated on-demand)
- **Pagination**: Required for lists (default 20/page)
- **Performance**: Batch checks, cache followed IDs for feed, indexes on both columns
- **Integration**: Following status across profiles/articles/comments, getFollowedUserIds() for feed
- **Error handling**: BadRequestException (self-follow), NotFoundException (invalid user), idempotent operations

---

## 🚀 Implementation Sequence

1. **DTOs** (2h) - Response, profile, query DTOs
2. **Service** (5h) - Follow/unfollow, lists, batch checks
3. **Controller** (2h) - Four endpoints, Swagger
4. **Users Integration** (2h) - Profile following status
5. **Articles Integration** (3h) - Feed implementation
6. **Module** (1h) - Wire FollowsModule
7. **Testing** (6h) - Unit, E2E, integration tests

**Total:** ~21 hours (2.6 days)

---

**Status:** Ready for Implementation
**Dependencies:** Phase 2 (Users), Phase 4 (Articles)
**Estimated Time:** 2.6 days
**Test Coverage:** > 85%
