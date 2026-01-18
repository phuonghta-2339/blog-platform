# Feature: Tags Management

## 📌 Overview

Implement read-only tag system with seeded data, caching, and denormalized counts for article filtering without user CRUD operations.

**Cross-Module Dependencies:**

- Seed Data → Phase 3 (This module)
- Used by → Articles filtering

---

## 🎯 Core Requirements

### Tag System Features

- List all tags (GET /tags) - public access
- Get tag details with article list (GET /tags/:slug) - public access
- Seeded data from predefined list (50+ tags)
- No create/update/delete for regular users
- Admin tag management (TODO for later)
- Used for article filtering and categorization

### Data Requirements

- Unique slug and name (database constraints)
- Many-to-many relationship with Articles
- Denormalized articlesCount for performance
- Redis/memory caching (TTL 1 hour)
- Preloaded at application startup

### Authorization Rules

- **PUBLIC:** Can list all tags and view details
- **No authentication required** for any tag operations
- **Admin only:** Future CRUD operations (not implemented yet)

### Performance

- Cache all tags in Redis/memory (1 hour TTL)
- Index on slug for fast lookups
- Preload cache at startup
- Denormalized counts updated on article changes
- Alphabetical ordering by name

---

## 🏗️ Module Structure

```text
src/
└── modules/
    └── tags/
        ├── dto/                    # Response DTOs
        ├── tags.controller.ts
        ├── tags.service.ts
        └── tags.module.ts

prisma/
├── seed.ts                         # Main seed script
└── seeds/
    └── tags.seed.ts                # Tag seed data (50+ tags)
```

---

## 📋 Implementation Components

### 1. Seed Data

- 50+ predefined tags (programming languages, frameworks, topics)
- Tags data in prisma/seeds/tags.seed.ts
- Upsert logic in seed script (idempotent)
- Categories: Languages, Frameworks, Tools, Concepts, Practices

### 2. DTOs

- TagResponseDto: id, name, slug, articlesCount, createdAt
- TagWithArticlesDto: tag data + articles list (limited to 20)
- No input DTOs (read-only system)

### 3. Tags Service

- findAll: return all tags with caching
- findBySlug: return tag with recent articles
- clearCache: invalidate cache on demand
- preloadCache: warm up cache at startup
- Batch article count updates

### 4. Tags Controller

- GET /tags: list all tags (public)
- GET /tags/:slug: tag details with articles (public)
- Public decorator applied (no auth required)
- Swagger documentation

### 5. Caching Layer

- CacheModule configuration (Redis or in-memory)
- 1-hour TTL for tag lists
- Cache key: 'tags:all' and 'tags:{slug}'
- Automatic invalidation on data changes

### 6. Cache Preloading

- Load all tags into cache at application startup
- main.ts bootstrap: call tagsService.preloadCache()
- Ensures fast first request
- Logged cache hits/misses for monitoring

---

## ✅ Verification Checklist

### Functionality

- [ ] GET /tags returns all tags
- [ ] GET /tags accessible without authentication
- [ ] GET /tags returns cached data on subsequent calls
- [ ] GET /tags includes articlesCount for each tag
- [ ] GET /tags orders tags alphabetically
- [ ] GET /tags/:slug returns tag with articles
- [ ] GET /tags/:slug limits articles to 20
- [ ] GET /tags/:slug returns 404 for invalid slug
- [ ] Seed script creates all tags successfully
- [ ] Seed script is idempotent (can run multiple times)

### Performance

- [ ] Cache hit rate > 90% for tag requests
- [ ] First request after startup uses preloaded cache
- [ ] Tag queries use slug index
- [ ] Cache TTL configured to 1 hour

### Data Integrity

- [ ] All tag slugs are unique
- [ ] articlesCount matches actual count
- [ ] Denormalized counts update on article changes

---

## 📚 Production Best Practices

**Caching:** Redis/in-memory cache, 1-hour TTL, preloading, hit/miss logging

**Public API:** No authentication, accessible to all users

**Seeding:** Comprehensive seed data, upsert logic, idempotent operations

**Performance:** Denormalized counts, indexed queries, alphabetical ordering

**Read-Only:** No create/update/delete endpoints for users

**Validation:** Slug-based lookups, SEO-friendly URLs

**Error Handling:** NotFoundException for invalid slugs

**Logging:** Cache operations, performance metrics

---

## 🚀 Implementation Sequence

1. **Seed Data** (2h)
   - Create tagsSeedData array (50+ tags)
   - Update prisma/seed.ts with upsert logic

2. **Cache Setup** (2h)
   - Install cache-manager packages
   - Configure CacheModule (Redis optional)

3. **DTOs** (1h)
   - TagResponseDto, TagWithArticlesDto

4. **Tags Service** (3h)
   - findAll with caching, findBySlug
   - preloadCache, clearCache methods

5. **Tags Controller** (2h)
   - GET /tags, GET /tags/:slug endpoints
   - Public decorators, Swagger docs

6. **Cache Preloading** (1h)
   - Update main.ts to preload cache
   - Verify cache TTL and hit rate

7. **Testing** (3h)
   - Unit tests for service methods
   - E2E tests for endpoints
   - Seed script tests

**Total:** ~14 hours (1.75 days)

**Next Phase:** Articles Management

---

**Status:** Ready for Implementation
**Dependencies:** None (Phase 0 infrastructure)
**Estimated Time:** 1.75 days (14 hours)
**Test Coverage Target:** > 85%

**Production-Ready Features:**

- ✅ Read-only tag system
- ✅ 50+ seeded tags
- ✅ Redis/memory caching (1-hour TTL)
- ✅ Public API endpoints
- ✅ Preloaded cache at startup
- ✅ Denormalized article counts
- ✅ SEO-friendly slug URLs
- ✅ Alphabetical ordering
