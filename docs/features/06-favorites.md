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
src/modules/favorites/
├── dto/
│   ├── favorite-response.dto.ts
│   └── article-summary.dto.ts
├── favorites.controller.ts
├── favorites.service.ts
└── favorites.module.ts
```

---

## 📋 Implementation Components

### 1. DTOs

- FavoriteResponseDto: article summary after favorite/unfavorite
- ArticleSummaryDto: basic article info with counts

### 2. Favorites Service

- favoriteArticle: create favorite, increment count in transaction (idempotent)
- unfavoriteArticle: delete favorite, decrement count in transaction (idempotent)
- isFavorited: check if user favorited specific article
- batchCheckFavorited: check multiple articles at once
- getFavoritedArticleIds: for filtering queries

### 3. Favorites Controller

- POST /articles/:slug/favorite: favorite article
- DELETE /articles/:slug/favorite: unfavorite article
- Both return updated article with new favoritesCount

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

**Idempotency:** Safe to retry favorite/unfavorite without side effects
**Transaction Safety:** Count updates atomic with favorite create/delete
**Composite Key:** Database-level duplicate prevention
**Concurrent Safety:** Database constraints handle race conditions
**Performance:** Batch checking for list endpoints

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
