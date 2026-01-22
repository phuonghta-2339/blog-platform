# Feature: Articles Management

## 📌 Overview

Implement CRUD operations for articles with pagination, filtering, slug generation, favorites/comments counts, personal feed, and public/authenticated views.

**Cross-Module Dependencies:**

- Tags Module → Tag filtering and article-tag relations
- Users Module → Author information and following
- Auth Module → Authentication and authorization
- Used by → Comments, Favorites modules

**Key Implementation Notes:**

- Auto-generate unique slugs from titles (with timestamp suffix for duplicates)
- Denormalized counts (favoritesCount, commentsCount) for performance
- Tag cache invalidation on article create/update/delete
- Pagination required (default 20, max 99)
- Guard-based authorization (ArticleAuthorGuard)
- Optional caching for performance (article detail, lists, feed)
- **Critical:** GET uses :slug (immutable, SEO-friendly), PUT/DELETE use :id (preventing race conditions on slug changes)
- **Race Condition Prevention:** :id ensures consistency when article title (and thus slug) may change during concurrent requests

---

## 🎯 Core Requirements

### Article Management Features

- Create article (POST /articles) - authenticated
- List articles with filters (GET /articles) - public/authenticated
- Get single article (GET /articles/:slug) - public/authenticated
- Update article (PUT /articles/:id) - author or admin only
- Delete article (DELETE /articles/:id) - author or admin only
- Personal feed (GET /articles/feed) - authenticated (from followed users)
- Auto-generate unique slug from title
- Draft/published status support
- Public and authenticated access

### Query & Filtering

- Pagination (limit/offset, default 20 per page, max 99)
- Filter by tag, author, favorited user
- Sort by: createdAt, favoritesCount, commentsCount
- Order: asc or desc

### Data Requirements

- Article belongs to one User (author)
- Many-to-many with Tags and Favorites
- One-to-many with Comments
- Unique URL-friendly slug
- Denormalized: favoritesCount, commentsCount
- articlesCount update on tags when article created/deleted

### Authorization Rules

- **PUBLIC:** Can read published articles
- **USER:** Can CRUD own articles
- **ADMIN:** Can CRUD any article

### Performance

- Indexed queries (slug, authorId, tags)
- Denormalized counts updated on related actions
- Optional caching (detail: 5min, list: 2min, feed: 1min)
- Tag cache invalidation when articles change

---

## 🏗️ Module Structure

```text
src/
├── common/
│   ├── cache/
│   │   ├── cache.config.ts             # CacheKeys patterns
│   │   └── cache.module.ts             # Global cache (no local imports needed)
│   ├── constants/
│   │   └── cache.ts                    # CACHE_TTL constants
│   └── utils/
│       ├── slug.util.ts
│       └── pagination.util.ts
└── modules/articles/
    ├── dto/
    │   ├── create-article.dto.ts
    │   ├── update-article.dto.ts
    │   ├── article-query.dto.ts
    │   ├── article-response.dto.ts
    │   └── paginated-articles.dto.ts
    ├── guards/
    │   └── article-author.guard.ts
    ├── articles.controller.ts
    ├── articles.service.ts
    └── articles.module.ts
```

**Note:**

- No barrel exports (index.ts) - import directly from files
- CacheModule is Global - no local imports needed

### Import Path Conventions

**Absolute Paths** (cross-module imports):

```typescript
// From articles module importing from other modules
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Public } from '@modules/auth/decorators/public.decorator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { slugify } from '@common/utils/slug.util';
```

**Relative Paths** (within same module):

```typescript
// Within articles module
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticlesService } from './articles.service';
import { ArticleAuthorGuard } from './guards/article-author.guard';
```

---

## 📋 Implementation Components

### 1. Common Utilities

- `slugify(title)`: Generate URL-friendly slug with timestamp suffix for duplicates
- `calculatePagination(total, limit, offset)`: Calculate pagination metadata
- Prisma converters (limit/offset to take/skip)

### 2. DTOs

- **CreateArticleDto:** title, description, body, tagList[], draft?
- **UpdateArticleDto:** Partial of CreateArticleDto
- **ArticleQueryDto:** tag?, author?, favorited?, limit?, offset?, sortBy?, order?
- **ArticleResponseDto:** article data + author + tags + favorited + following
- **PaginatedArticlesDto:** articles[] + pagination metadata

### 3. Article Author Guard

- Verify current user is article author OR admin
- Applied to PUT /articles/:id and DELETE /articles/:id
- Throw ForbiddenException if unauthorized

### 4. Articles Service

**Core Methods:**

- `create()`: Slug generation, tag connections, cache invalidation
- `findAll(query)`: Filters, pagination, optional caching
- `findOne(slug)`: Detail with optional caching
- `update()`: Handle tags, invalidate caches
- `delete()`: Update tag counts, invalidate caches
- `getFeed(userId)`: Articles from followed users

**Cache Integration:**

- Inject CACHE_MANAGER (global)
- Article detail: CacheKeys.article(slug), CACHE_TTL.MEDIUM (5min)
- Article lists: CacheKeys.articleList(page, limit), CACHE_TTL.SHORT (2min)
- User feed: custom key, CACHE_TTL.SHORT (1min)

**Tag Coordination:**

- Call tagsService.clearCache() on create/update/delete
- Update articlesCount within transaction
- Only for published articles

### 5. Articles Controller

**Endpoints:**

- `POST /articles` - Create (authenticated, returns created article)
- `GET /articles` - List with filters (public, returns paginated list)
- `GET /articles/feed` - Personal feed (authenticated, followed users)
- `GET /articles/:slug` - Detail (public, returns single article)
- `PUT /articles/:id` - Update (author/admin only with guard)
- `DELETE /articles/:id` - Delete (author/admin only with guard)

**Key Notes:**

- Use @Public() for GET /articles and GET /articles/:slug
- Place GET /articles/feed BEFORE GET /articles/:slug to avoid route conflict
- Use ArticleAuthorGuard for update/delete
- Swagger documentation for all endpoints

---

## ✅ Verification Checklist

### CRUD & Authorization

- [ ] Create article generates unique slug
- [ ] Update/delete protected by ArticleAuthorGuard
- [ ] Public access works for list and detail
- [ ] Admin can update/delete any article

### Filtering & Pagination

- [ ] Filter by tag/author/favorited works
- [ ] Pagination with metadata correct
- [ ] Feed shows only followed users' articles
- [ ] Sort and order parameters work

### Data Integrity & Performance

- [ ] Tag articlesCount updated on article changes
- [ ] Tag caches invalidated on article changes
- [ ] Denormalized counts (favorites, comments) accurate
- [ ] Indexed queries performing well
- [ ] Cache behavior correct (if implemented)

---

## 📚 Production Best Practices

**Slug Generation:**

- URL-friendly slugs from titles using slugify utility
- Timestamp suffix for duplicates (Date.now() + counter)
- Unique constraint at database level with while loop check
- Slug validation in DTOs (lowercase, hyphens, alphanumeric)

**Pagination:**

- Required for all list endpoints (findAll, getFeed)
- Default 20, max 99 items per page
- Include metadata (total, totalPages, currentPage, limit)
- Use PaginationDto from '@common/dto/pagination.dto'

**Authorization:**

- Guard-based with ArticleAuthorGuard for update/delete
- Author OR admin check using request.user.role
- @Public() decorator for GET /articles and GET /articles/:slug
- ForbiddenException for unauthorized access

**Performance:**

- Database indexes on slug (unique), authorId, createdAt
- Denormalized counts (favoritesCount, commentsCount) with transaction updates
- Optional caching with CacheKeys patterns and CACHE_TTL constants
- Batch queries with Promise.all for tag operations
- Efficient SELECT queries with explicit field selection

**Tag Integration:**

- Update tag articlesCount on article create/delete (use Prisma transactions)
- Increment articlesCount when published article created with tags
- Decrement articlesCount when published article deleted
- Only update counts for published articles (draft articles don't affect counts)
- Invalidate tag caches after count updates: tagsService.clearCache()
- Many-to-many relation via ArticleTag junction table
- Transaction ensures atomicity: article + tags + counts updated together
- Cache invalidation OUTSIDE transaction to avoid locking

**Transaction Safety:**

- Prisma.$transaction() with ReadCommitted isolation level
- Atomic operations for article + tags + counts
- Rollback on failure ensures data consistency
- Cache invalidation in .then() callback (outside transaction)
- Use Promise.all for parallel tag updates within transaction
- Check for existing slug before creation to prevent duplicates

**Error Handling:**

- NotFoundException for invalid slug with descriptive message
- ForbiddenException for unauthorized access (ArticleAuthorGuard)
- BadRequestException for validation errors (class-validator)
- Prisma error handling for unique constraints
- Proper HTTP status codes (200, 201, 404, 403, 400)

**Module Configuration:**

- ArticlesModule imports DatabaseModule only (CacheModule is global)
- Export ArticlesService for Comments and Favorites modules
- Inject TagsService for cache invalidation coordination
- NO CacheModule.register() needed in module
- **CRITICAL:**
- Comments and Favorites services independently query articles by ID for operations

**Transaction Pattern:**

Articles use Prisma transactions for atomicity:

- **Create**: Slug generation → article creation → tag connections → count updates
- **Delete**: Get article+tags → decrement counts → delete article
- **Isolation**: ReadCommitted level
- **Cache invalidation**: In .then() callback (outside transaction)
- **Published only**: Only count published articles for tag articlesCount

**Error Handling:**

- NotFoundException for invalid slug
- ForbiddenException for unauthorized access
- Validation errors for invalid input

---

## 🚀 Implementation Sequence

### Step 1: Utilities (2h)

- Slug generation function with duplicate handling
- Pagination calculation helper
- Prisma query converters

### Step 2: DTOs (2h)

- Create/Update/Query DTOs with validation
- Response DTOs with relations
- Paginated response wrapper

### Step 3: Article Author Guard (1.5h)

- Implement author OR admin check
- Integration with AuthenticatedUser
- Error handling

### Step 4: Articles Service (6h)

- CRUD methods with slug generation
- Filtering and pagination logic
- Tag relations and cache invalidation
- Feed query for followed users
- Optional caching implementation

### Step 5: Articles Controller (2.5h)

- Six endpoints with proper decorators
- Route ordering (feed before :slug)
- Public decorator for read operations
- Swagger documentation

### Step 6: Integration (2h)

- Wire ArticlesModule to V1Module
- Test all endpoints
- Verify tag integration
- Check cache behavior

### Step 7: Testing (4h)

- Unit tests (service, guard, utilities)
- E2E tests (all endpoints)
- Authorization scenarios
- Tag integration tests
- Cache behavior tests

**Total:** ~20 hours (2.5 days)

**Next Phase:** Comments Management (Phase 5)

---

**Status:** Ready for Implementation
**Dependencies:** Phase 0 (Infrastructure), Auth, Users, Tags Modules
**Estimated Time:** 2.5 days (20 hours)
**Test Coverage Target:** ≥ 85%

**Implementation Notes:**

- Feed route MUST be placed before :slug route
- Always invalidate tag caches on article changes
- Update tag articlesCount on create/delete
- Use ArticleAuthorGuard for update/delete endpoints
- Optional: Implement caching selectively based on traffic
