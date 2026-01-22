# Feature: Comments Management

## 📌 Overview

Implement CR-D operations for comments (no update by design) with article linking, denormalized counts, and transaction safety for data integrity.

**Key Implementation Notes:**

- Comments use article :id (not :slug) to avoid race conditions when article slug changes
- Comment delete endpoint uses :commentId (not :id) to avoid parameter ambiguity
- Cascade delete: when article deleted, all comments deleted (Prisma cascade)
- Transaction safety: comment create/delete + commentsCount update atomic

---

## 🎯 Core Requirements

### Comment Operations

- Create comment on article (POST /articles/:id/comments) - authenticated
- List comments on article (GET /articles/:id/comments) - public with pagination
- Delete own comment (DELETE /articles/:id/comments/:commentId) - author or admin
- No update operation (transparency by design)

### Data Requirements

- Comment belongs to one Article and one User
- Flat structure (no nested comments)
- Denormalized commentsCount in Article table
- Timestamps for creation tracking

### Authorization Rules

- **USER:** Can create comment on published articles
- **USER:** Can delete own comments only
- **ADMIN:** Can delete any comment
- **PUBLIC:** Can read comments without auth

### Performance

- Pagination required (default 20 per page)
- Indexed queries on articleId and authorId
- Transaction safety for count updates
- Eager load author info to avoid N+1

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
└── modules/comments/
    ├── dto/
    │   ├── create-comment.dto.ts
    │   ├── comment-response.dto.ts
    │   └── comment-query.dto.ts
    ├── guards/
    │   └── comment-author.guard.ts     # For delete authorization
    ├── comments.controller.ts
    ├── comments.service.ts
    └── comments.module.ts
```

**Note:**

- No barrel exports (index.ts) - import directly from files
- CacheModule is Global - no local imports needed
- CommentsModule imports DatabaseModule and ArticlesModule only

### Import Path Conventions

**Absolute Paths** (cross-module imports):

```typescript
// From comments module importing from other modules
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Public } from '@modules/auth/decorators/public.decorator';
import { ArticlesService } from '@modules/articles/articles.service';
```

**Relative Paths** (within same module):

```typescript
// Within comments module
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsService } from './comments.service';
import { CommentAuthorGuard } from './guards/comment-author.guard';
```

---

## 📋 Implementation Components

### 1. DTOs

- CreateCommentDto: body validation (max 2000 chars)
- CommentResponseDto: with author info and following status
- CommentQueryDto: pagination and sorting options

### 2. Comments Service

**Core Methods:**

- `create()`: Transaction (comment + increment article.commentsCount)
- `findAll()`: Paginated list with eager-loaded author
- `findOne()`: Single comment with author
- `delete()`: Transaction (delete + decrement article.commentsCount)

**Key Points:**

- Verify article published before create
- Authorization check (author OR admin)
- No update operation (immutable by design)
- Optional caching: CACHE_TTL.SHORT (60s) for lists

### 2.1. Caching Strategy (Optional)

**Implementation:**

- Inject CACHE_MANAGER (global, no local import)
- Cache key: `comments:article:${articleId}:${page}`
- TTL: CACHE_TTL.SHORT (60s) - frequently updated
- Invalidate after create/delete
- Cache only for high-traffic articles

### 3. Comments Controller

**Endpoints:**

- POST /articles/:id/comments - Create (authenticated)
- GET /articles/:id/comments - List (public with @Public())
- DELETE /articles/:id/comments/:commentId - Delete (CommentAuthorGuard)

**Configuration:**

- @ApiTags('comments'), @Controller('articles/:id/comments')
- Nested route under articles
- Use @CurrentUser() for authenticated requests

---

## ✅ Verification Checklist

### CRUD Operations

- [ ] Create increments article.commentsCount
- [ ] Create rejects unpublished articles
- [ ] Delete decrements article.commentsCount
- [ ] Delete verifies ownership or admin role
- [ ] List accessible without authentication
- [ ] Transactions rollback on errors

### Data Integrity

- [ ] commentsCount stays synchronized
- [ ] Following status shown correctly
- [ ] Pagination metadata accurate

---

## 📚 Production Best Practices

**Transaction Safety:**

- All count updates wrapped in Prisma transactions
- Atomic operations: comment + article.commentsCount together
- Rollback on any failure ensures data consistency
- Use `prisma.$transaction()` for all create/delete operations
- Isolation level: ReadCommitted to prevent dirty reads
- **CRITICAL:** Article lookup uses :id to prevent race conditions when article is being renamed

**No Update Operation:**

- Transparency by design - comments are immutable
- Only create and delete allowed
- Builds trust and accountability

**Authorization:**

- CommentAuthorGuard verifies ownership
- Author OR admin can delete
- ForbiddenException for unauthorized attempts

**Pagination:**

- Required for all list endpoints
- Default 20 per page
- Prevents unbounded queries
- Include metadata (total, pages)

**Error Handling:**

- NotFoundException for invalid article/comment ID
- ForbiddenException for unauthorized delete
- BadRequestException for validation errors
- Proper HTTP status codes

**Performance:**

- Eager load author to avoid N+1 queries
- Index on (articleId, createdAt) for efficient pagination
- Select only needed fields
- Optional caching for high-traffic articles

---

## 🚀 Implementation Sequence

1. **DTOs** (2h) - Create, Response, Query DTOs
2. **Service** (4h) - CR-D with transactions, mapping
3. **Controller** (3h) - Nested routes, guards, Swagger
4. **Module** (1h) - Wire dependencies
5. **Testing** (5h) - Unit, E2E, transaction tests
6. **Integration** (1h) - Verify with Articles module

**Total:** ~16 hours (2 days)

---

**Status:** Ready for Implementation
**Dependencies:** Phase 4 (Articles)
**Estimated Time:** 2 days
**Test Coverage:** > 85%
