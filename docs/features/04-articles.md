# Feature: Articles Management

## 📌 Overview

Implement CRUD operations for articles with pagination, filtering, slug generation, favorites/comments counts, personal feed, and public/authenticated views.

**Cross-Module Dependencies:**

- Slug & Pagination Utilities → Phase 4 (This module)
- Used by → Comments, Favorites modules

---

## 🎯 Core Requirements

### Article Management Features

- Create article (POST /articles) - authenticated
- List articles with filters (GET /articles) - public/authenticated
- Get single article (GET /articles/:slug) - public/authenticated
- Update article (PUT /articles/:slug) - author or admin only
- Delete article (DELETE /articles/:slug) - author or admin only
- Personal feed (GET /articles/feed) - authenticated (from followed users)
- Auto-generate unique slug from title
- Draft/published status support

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

### Authorization Rules

- **PUBLIC:** Can read published articles
- **USER:** Can CRUD own articles
- **ADMIN:** Can CRUD any article

### Performance

- Pagination required, indexed queries
- Denormalized counts, batch status checks

---

## 🏗️ Module Structure

```text
src/
├── common/utils/
│   ├── slug.util.ts
│   └── pagination.util.ts
└── modules/articles/
    ├── dto/
    ├── guards/
    │   └── article-author.guard.ts
    ├── articles.controller.ts
    ├── articles.service.ts
    └── articles.module.ts
```

---

## 📋 Implementation Components

### 1. Common Utilities

- Slug generator with timestamp suffix for duplicates
- Pagination helper for metadata calculation
- Prisma page converter (limit/offset to take/skip)

### 2. DTOs

- CreateArticleDto, UpdateArticleDto, ArticleQueryDto
- ArticleResponseDto with author, tags, favorited, following
- Paginated response with metadata

### 3. Article Author Guard

- Verify user is author or admin
- Applied to update/delete endpoints

### 4. Articles Service

- CRUD with slug generation, filtering, pagination
- getFeed for followed users' articles
- Batch favorited/following status checks

### 5. Articles Controller

- Six endpoints: create, list, feed, get, update, delete
- Guards, validation, Swagger docs

---

## ✅ Verification Checklist

### CRUD & Filtering

- [ ] Create/update/delete with authorization
- [ ] List with tag/author/favorited filters
- [ ] Feed shows only followed users' articles
- [ ] Pagination and slug generation work

### Data & Performance

- [ ] Denormalized counts accurate
- [ ] Batch status checks efficient
- [ ] Indexes used, limits enforced

---

## 📚 Production Best Practices

**Slug:** URL-friendly, unique, timestamp suffix
**Pagination:** Required, metadata, max 99
**Authorization:** Guard-based, ownership checks
**Performance:** Indexed, denormalized, batched

---

## 🚀 Implementation Sequence

1. **Utilities** (3h) - Slug, pagination
2. **DTOs** (3h) - CRUD and query DTOs
3. **Guard** (2h) - Author authorization
4. **Service** (6h) - CRUD, queries, filtering
5. **Controller** (3h) - Endpoints, Swagger
6. **Feed** (3h) - Followed users feed
7. **Integration** (2h) - Wire modules
8. **Testing** (6h) - Unit, E2E tests

**Total:** ~28 hours (3.5 days)

---

**Status:** Ready for Implementation
**Dependencies:** Phases 0-2
**Estimated Time:** 3.5 days
**Test Coverage:** > 85%
