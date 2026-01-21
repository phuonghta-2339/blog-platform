# Feature: Favorites Management

## 📌 Overview

Implement toggle favorite operations with idempotent design, denormalized counts, and transaction safety for concurrent request handling.

**Cross-Module Dependencies:**

- Used by → Articles module (favoritesCount, favorited status)
- Depends on → Articles, Users modules

---

## 🎯 Core Requirements

### Favorite Operations

- Favorite article (POST /articles/:slug/favorite) - authenticated
- Unfavorite article (DELETE /articles/:slug/favorite) - authenticated
- List favorited articles (GET /articles?favorited={username}) - handled by Articles
- Idempotent operations (safe retries)

### Data Requirements

- Many-to-many relationship (User ↔ Article)
- Composite unique key (userId, articleId)
- Denormalized favoritesCount in Article table
- Timestamp for favorite creation

### Authorization Rules

- **USER:** Can favorite/unfavorite any published article
- **PUBLIC:** Can see favoritesCount
- **No self-favorite rule** (optional - allow users to favorite own articles)

### Performance

- Transaction safety for count updates
- Composite unique index prevents duplicates
- Idempotent operations (no error on duplicate)
- Concurrent request safety via database constraints

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
└── modules/favorites/
    ├── dto/
    │   ├── favorite-response.dto.ts
│   └── article-summary.dto.ts
├── favorites.controller.ts
├── favorites.service.ts
└── favorites.module.ts
```

**Note:** No barrel exports (index.ts) - import directly from files

### Import Path Conventions

**Absolute Paths** (cross-module imports):

```typescript
// From favorites module importing from other modules
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { ArticlesService } from '@modules/articles/articles.service';
```

**Relative Paths** (within same module):

```typescript
// Within favorites module
import { FavoriteResponseDto } from './dto/favorite-response.dto';
import { FavoritesService } from './favorites.service';
```

---

## 📋 Implementation Components

### 1. DTOs

- FavoriteResponseDto: article summary after favorite/unfavorite
- ArticleSummaryDto: basic article info with counts

### 2. Favorites Service

**Core Methods:**

- `favoriteArticle()`: Idempotent add (check exists → create + increment)
- `unfavoriteArticle()`: Idempotent remove (delete → decrement if existed)
- `isFavorited()`: Boolean check for single article
- `batchCheckFavorited()`: Array of favorited articleIds (avoid N+1)
- `getFavoritedArticleIds()`: For filtering (WHERE IN clause)

**Key Points:**

- Idempotent: safe to call multiple times, no errors
- Transaction: favorite/unfavorite + count update together
- Composite unique key (userId, articleId) prevents duplicates
- Check existence before count updates

### 3. Favorites Controller

**Endpoints:**

- POST /articles/:slug/favorite - Favorite article (authenticated)
- DELETE /articles/:slug/favorite - Unfavorite (authenticated)

**Configuration:**

- @ApiTags('favorites'), @Controller('articles/:slug/favorite')
- Both return updated article with new favoritesCount
- No @Public() - authentication required

### 4. Integration with Articles

- Articles.findAll: batch check favorited status
- Articles.findOne: check favorited status for current user
- Filter: GET /articles?favorited={username}

---

## ✅ Verification Checklist

### Operations

- [ ] Favorite increments article.favoritesCount
- [ ] Unfavorite decrements article.favoritesCount
- [ ] Operations are idempotent (no errors on retry)
- [ ] Concurrent favorites handled correctly
- [ ] Unpublished articles cannot be favorited
- [ ] Transactions rollback on errors

### Data Integrity

- [ ] favoritesCount stays synchronized
- [ ] Composite unique key prevents duplicates
- [ ] Batch checks efficient (no N+1 queries)

---

## 📚 Production Best Practices

**Idempotency:**

- Favorite operation safe to call multiple times (no duplicate creation)
- Unfavorite operation safe when already unfavorited (no error thrown)
- Check existence before count update
- Critical for network retry scenarios

**Transaction Safety:**

- All operations wrapped in Prisma transactions
- Atomic: favorite/unfavorite + count update together
- Rollback on failure ensures consistency
- Use `prisma.$transaction()` for all operations

**Composite Unique Key:**

- Database constraint: `(userId, articleId)` must be unique
- Prevents duplicate favorites at DB level
- No application-level locking needed
- Handles concurrent requests automatically

**Concurrent Request Safety:**

- Database constraints prevent race conditions
- Transaction isolation level protects count updates
- Idempotent design allows safe retries
- No deadlock risk with proper transaction scope

**Performance Optimization:**

- Batch check favorited status (one query for multiple articles)
- Avoid N+1 queries in article lists
- Index on both userId and articleId
- Efficient WHERE IN queries for filtering

**Error Handling:**

- NotFoundException for invalid article slug
- Proper HTTP status codes
- No error on duplicate/missing favorite (idempotent)
- Graceful handling of edge cases

---

## 🚀 Implementation Sequence

1. **DTOs** (1h) - Response and summary DTOs
2. **Service** (4h) - CRUD with transactions, batch operations
3. **Controller** (2h) - Toggle endpoints, Swagger
4. **Articles Integration** (3h) - Batch checks, filtering
5. **Module** (1h) - Wire FavoritesModule to Articles
6. **Testing** (5h) - Unit, E2E, concurrency tests
7. **Performance** (1h) - Verify batch checks, monitor query count

**Total:** ~17 hours (2.1 days)

---

**Status:** Ready for Implementation
**Dependencies:** Phase 4 (Articles)
**Estimated Time:** 2.1 days
**Test Coverage:** > 85%
