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
- List followers (GET /profiles/:username/followers) - public with pagination
- List following (GET /profiles/:username/following) - public with pagination
- Cannot follow yourself (enforced at service level)
- Idempotent operations (safe retries)

### Data Requirements

- Many-to-many relationship (User ↔ User)
- Composite unique key (followerId, followingId)
- Optional denormalized counts in User profile (followersCount, followingCount)
- Timestamps for follow creation

### Authorization Rules

- **USER:** Can follow/unfollow any user except self
- **PUBLIC:** Can view followers/following lists
- **Authenticated:** Required for follow/unfollow actions

### Performance

- Composite unique index for fast lookups
- Pagination for followers/following lists
- Batch check for following status
- Efficient feed queries (articles from followed users)

---

## 🏗️ Module Structure

```text
src/modules/follows/
├── dto/
│   ├── follow-response.dto.ts
│   ├── profile.dto.ts
│   └── follow-list-query.dto.ts
├── follows.controller.ts
├── follows.service.ts
└── follows.module.ts
```

---

## 📋 Implementation Components

### 1. DTOs

- FollowResponseDto: profile data after follow/unfollow
- ProfileDto: username, bio, avatar, following status
- FollowListQueryDto: pagination and sorting for lists

### 2. Follows Service

- followUser: create follow, prevent self-follow (idempotent)
- unfollowUser: delete follow (idempotent)
- getFollowers: paginated list of user's followers
- getFollowing: paginated list of users being followed
- isFollowing: check if current user follows target
- batchCheckFollowing: check multiple users at once
- getFollowedUserIds: for feed queries

### 3. Follows Controller

- POST /profiles/:username/follow: follow user
- DELETE /profiles/:username/follow: unfollow user
- GET /profiles/:username/followers: list followers (public)
- GET /profiles/:username/following: list following (public)
- All return profile with following status

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

**Self-Follow Prevention:** Service-level validation before database
**Idempotency:** Safe to retry without side effects
**Composite Key:** Database-level duplicate prevention
**Pagination:** Required for followers/following lists
**Performance:** Batch checks, indexed queries
**Integration:** Following status shown in articles, comments, profiles

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
