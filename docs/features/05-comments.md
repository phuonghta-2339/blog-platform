# Feature: Comments Management

## 📌 Overview

Implement CR-D operations for comments (no update by design) with article linking, denormalized counts, and transaction safety for data integrity.

**Cross-Module Dependencies:**

- Used by → Articles module (commentsCount)
- Depends on → Articles, Users modules

---

## 🎯 Core Requirements

### Comment Operations

- Create comment on article (POST /articles/:slug/comments) - authenticated
- List comments on article (GET /articles/:slug/comments) - public with pagination
- Delete own comment (DELETE /articles/:slug/comments/:id) - author or admin
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
src/modules/comments/
├── dto/
│   ├── create-comment.dto.ts
│   ├── comment-response.dto.ts
│   └── comment-query.dto.ts
├── comments.controller.ts
├── comments.service.ts
└── comments.module.ts
```

---

## 📋 Implementation Components

### 1. DTOs

- CreateCommentDto: body validation (max 2000 chars)
- CommentResponseDto: with author info and following status
- CommentQueryDto: pagination and sorting options

### 2. Comments Service

- create: with article existence check, increment count in transaction
- findAll: paginated list with author eager loading
- findOne: single comment retrieval
- delete: with authorization check, decrement count in transaction
- mapToResponse: include following status for current user

### 3. Comments Controller

- POST /articles/:slug/comments: create comment
- GET /articles/:slug/comments: list with pagination (public)
- GET /articles/:slug/comments/:id: single comment (public)
- DELETE /articles/:slug/comments/:id: delete with auth check
- Nested routes under articles

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

**Transaction Safety:** Create/delete use transactions for count updates
**No Update:** Transparency - comments are immutable once created
**Authorization:** Owner or admin checks for deletion
**Pagination:** Required to prevent unbounded queries
**Error Handling:** NotFoundException, ForbiddenException

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
