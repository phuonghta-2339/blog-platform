# Feature: Tags Management

## 📌 Overview

Implement read-only tag system with seeded data, caching, and denormalized counts for article filtering without user CRUD operations.

**Cross-Module Dependencies:**

- Seed Data → Phase 3 (This module)
- Used by → Articles filtering (Phase 4)

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
- Many-to-many relationship with Articles (prepared for Phase 4)
- Denormalized articlesCount for performance
- In-memory caching with cache-manager (TTL 1 hour)
- Lazy cache loading on first request

### Authorization Rules

- **PUBLIC:** Can list all tags and view details
- **No authentication required** for any tag operations
- **Admin only:** Future CRUD operations (not implemented yet)

### Performance

- Cache all tags in Redis/memory (1 hour TTL)
- Index on slug for fast lookups
- Lazy cache population (cache on first request)
- Denormalized counts updated on article changes (Phase 4)
- Alphabetical ordering by name

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
└── modules/
    └── tags/
        ├── dto/                        # Response DTOs
        │   ├── tag-response.dto.ts
        │   └── tag-detail-response.dto.ts
        ├── tags.controller.ts
        ├── tags.service.ts
        └── tags.module.ts

prisma/
├── seed.ts                             # Main seed script
└── seeds/
    └── tags.seed.ts                    # Tag seed data (50+ tags)
```

**Note:**

- No barrel exports (index.ts) - import directly from files
- CacheModule is Global - no local imports needed

### Import Path Conventions

**Absolute Paths** (cross-module imports):

```typescript
// From tags module importing common decorators
import { Public } from '@modules/auth/decorators/public.decorator';
import { ApiResponse } from '@common/dto/response.dto';
```

**Relative Paths** (within same module):

```typescript
// Within tags module
import { TagResponseDto } from './dto/tag-response.dto';
import { TagsService } from './tags.service';
```

---

## 📋 Implementation Components

### 1. Seed Data

- 50+ predefined tags (programming languages, frameworks, topics)
- Tags data in prisma/seeds/tags.seed.ts
- Upsert logic in seed script (idempotent)
- Categories: Languages, Frameworks, Tools, Concepts, Practices

### 2. DTOs

**TagResponseDto:**

- id, name, slug, articlesCount, createdAt
- Used for GET /tags list response

**TagDetailResponseDto:**

- Extends TagResponseDto
- articles: ArticleResponseDto[] (recent articles with this tag)
- Pagination for articles (limit 20 by default)
- Used for GET /tags/:slug detail response

**No input DTOs** - read-only system in this phase

### 3. Tags Service

**Core Methods:**

- `findAll()`: All tags with CacheKeys.tagList(), CACHE_TTL.HOUR, alphabetical order
- `findBySlug(slug)`: Tag detail with recent 20 articles, CACHE_TTL.MEDIUM
- `clearCache(slug?)`: Invalidate specific or all tag caches

**Key Points:**

- CACHE_MANAGER injection (global)
- Logger.debug() for monitoring
- NotFoundException for invalid slug
- Include published articles only

### 4. Tags Controller

**Decorators & Configuration:**

- `@ApiTags('tags')` - use tag from swagger.config.ts
- `@Controller('tags')` - no version prefix (handled by v1 module)
- No `@Throttle()` needed - global throttle in app.module.ts
- Use `@Public()` decorator for public access

**Endpoints:**

**GET /tags** - List all tags

- Public access
- Returns: ApiResponse<TagResponseDto[]>
- Cache: 1 hour

**GET /tags/:slug** - Get tag detail with articles

- Public access
- Returns: `ApiResponse<TagDetailResponseDto>`
- Cache: 5 minutes
- 404 if tag not found

**Controller Pattern:**

```typescript
@ApiTags('tags')
@Controller('tags')
export class TagsController {
  @Get()
  @Public()
  async findAll(): Promise<ApiResponse<TagResponseDto[]>> {
    // List all tags
  }

  @Get(':slug')
  @Public()
  async findOne(@Param('slug') slug: string): Promise<ApiResponse<TagDetailResponseDto>> {
    // Get tag detail with articles
  }
}
```

### 5. Caching & ArticlesCount Management

**Cache Implementation:**

- Import DatabaseModule only (CacheModule is global)
- CACHE_TTL.HOUR for lists, CACHE_TTL.MEDIUM for details
- CacheKeys.tagList() standardized pattern
- Lazy loading on first request

**ArticlesCount Management:**

Articles module maintains articlesCount via transactions:

- **Create**: Increment for associated tags (published only)
- **Delete**: Decrement for associated tags
- **Transaction**: Atomic article + tags + counts
- **Cache**: Invalidate after transaction completes

**Best Practices:**

- Use increment/decrement (not manual counting)
- Only count published articles
- Cache invalidation outside transaction
- Call tagsService.clearCache() after updates

---

## ✅ Verification Checklist

### Functionality

- [ ] GET /tags returns all tags
- [ ] GET /tags accessible without authentication
- [ ] GET /tags returns cached data on subsequent calls
- [ ] GET /tags/:slug returns tag with recent articles
- [ ] GET /tags/:slug returns 404 for invalid slug
- [ ] GET /tags/:slug limits articles to 20
- [ ] GET /tags/:slug accessible without authentication
- [ ] articlesCount accurate for each tag
- [ ] Tags ordered alphabetically by name
- [ ] Response follows ApiResponse wrapper format
- [ ] Seed script creates all 50+ tags successfully
- [ ] Cache behavior correct for both endpoints

### Performance Metrics

- [ ] First request populates cache (lazy loading)
- [ ] Subsequent requests use cached data
- [ ] Cache TTL configured to 1 hour (3600 seconds)
- [ ] Tag queries order by name efficiently
- [ ] Response time < 50ms for cached requests
- [ ] Response time < 200ms for cache miss

### Data Integrity

- [ ] All tag slugs are unique in database
- [ ] All tag names are unique in database
- [ ] articlesCount initializes to 0 for seeded tags
- [ ] createdAt timestamp set correctly

---

## 📚 Production Best Practices

**Caching Strategy:**

- Global CacheModule (no local imports needed)
- CACHE_TTL.HOUR for tag lists (optimal for rarely changing data)
- CACHE_TTL.MEDIUM for tag detail (fresher article data)
- Lazy loading with cache on first request
- Logger.debug() for cache hit/miss monitoring
- CacheKeys patterns from '@/common/cache/cache.config'

**Public API Design:**

- @Public() decorator for all endpoints (no authentication required)
- Accessible to all users via global JwtAuthGuard bypass
- CORS enabled in app.module.ts for frontend integration

**Data Seeding:**

- 50+ comprehensive tags organized by categories
- Upsert logic for idempotency (safe to run multiple times)
- Categories: Languages, Frameworks, Tools, Concepts, Practices
- Seed script: `npm run prisma:seed` or `npx prisma db seed`

**Performance Optimization:**

- Denormalized articlesCount field updated via transactions
- Database index on slug column for fast lookups
- Alphabetical ordering at database level (orderBy: { name: 'asc' })
- Efficient SELECT queries with explicit field selection
- Lazy cache population (no eager loading)

**Read-Only System:**

- No create/update/delete endpoints in this phase
- Admin operations deferred to future phase (TODO)
- Tags managed via seed script only

**Transaction Safety:**

- articlesCount updates in Prisma transactions with Articles module
- Atomic increment/decrement operations (no manual counting)
- Rollback on failure ensures data consistency
- Cache invalidation after successful transaction

**Error Handling:**

- Graceful cache failures with logging (continue on cache miss)
- NotFoundException for invalid slug with descriptive message
- Database error handling with Prisma error filters
- Proper HTTP status codes (200, 404)

**Logging:**

- Logger.debug() for cache operations (hit/miss/clear)
- Query execution monitoring via Prisma logging
- Error tracking with contextual information

---

## 🚀 Implementation Sequence

### Step 1: Seed Data (1.5h)

- Create prisma/seeds/tags.seed.ts with 50+ tags
- Organize by categories (Languages, Frameworks, Tools, etc.)
- Update prisma/seed.ts with upsert logic
- Test seed script: `npm run prisma:seed`
- Verify all tags in database with unique slugs

### Step 2: DTOs (1h)

- Create TagResponseDto (basic tag info)
- Create TagDetailResponseDto (extends with articles)
- Swagger decorators (@ApiProperty)
- Validation decorators (class-validator)

### Step 3: Tags Service (3h)

- Implement findAll() with CacheKeys.tagList() and CACHE_TTL.HOUR
- Implement findBySlug() with 'tag:{slug}:detail' and CACHE_TTL.MEDIUM
- Implement clearCache() with optional slug param
- Include articles relation in findBySlug (limit 20, published only)
- Logger.debug() for cache hit/miss/clear monitoring
- NotFoundException for invalid slug
- CACHE_MANAGER injection via @Inject(CACHE_MANAGER)

### Step 4: Tags Module (0.5h)

- Create tags.module.ts
- Import DatabaseModule only (CacheModule is global)
- NO CacheModule.register() needed
- Register TagsController and TagsService
- Export TagsService for Articles module

### Step 5: Tags Controller (2h)

- Implement GET /tags (list all) with @Public()
- Implement GET /tags/:slug (detail with articles) with @Public()
- Swagger documentation with @ApiTags('tags')
- ApiResponse wrapper from '@common/dto/response.dto'
- Error handling with proper HTTP status codes

### Step 6: Integration (1h)

- Import TagsModule in V1Module
- Verify route registration
- Test endpoint: GET /api/v1/tags
- Verify Swagger documentation
- Check cache behavior (miss then hit)

### Step 7: Testing (3h)

- Unit tests for TagsService (findAll, findBySlug, clearCache)
- E2E tests for GET /tags (list)
- E2E tests for GET /tags/:slug (detail with articles)
- Test cache behavior for both endpoints
- Test 404 error handling
- Test article pagination in tag detail
- Verify seed script

**Total:** ~11.5 hours (1.4 days)

**Next Phase:** Articles Management (Phase 4)

---

**Status:** Ready for Implementation
**Dependencies:** Phase 0 (Common Infrastructure), Auth Module, Articles Module (for tag detail)
**Estimated Time:** 1.4 days (11.5 hours)
**Test Coverage Target:** ≥ 85%

**Production-Ready Features:**

- ✅ Read-only tag system (GET /tags, GET /tags/:slug)
- ✅ 50+ seeded tags with categories
- ✅ In-memory caching (1h for list, 5min for detail)
- ✅ Lazy cache loading
- ✅ Public API endpoints (no auth required)
- ✅ Tag detail with recent articles (limit 20)
- ✅ Denormalized article counts
- ✅ SEO-friendly slug URLs
- ✅ Alphabetical ordering
- ✅ Logger for monitoring
- ✅ Type-safe implementation
- ✅ Error handling (404 for invalid slug)
