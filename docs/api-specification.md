# API Specification - Blog Platform (Medium Clone)

## Overview

This document provides complete specifications for all REST API endpoints of the blog platform system.

Base URL: `http://localhost:3000/api/v1`

Authentication: JWT Bearer Token

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Users](#2-users)
3. [Articles](#3-articles)
4. [Comments](#4-comments)
5. [Tags](#5-tags)
6. [Favorites](#6-favorites)
7. [Follows](#7-follows)
8. [Common Error Responses](#common-error-responses)
9. [Rate Limiting](#rate-limiting)
10. [Pagination](#pagination)
11. [Sorting](#sorting)
12. [Filtering](#filtering)

---

## 1. Authentication

### 1.1. Register an account

**Endpoint:** `POST /auth/register`

**Access:** Public

**Request Body:**

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
}
```

**Validation:**

- Email: Valid email format, unique
- Username: 3-50 characters, alphanumeric + underscore, unique
- Password: Min 8 characters, at least 1 uppercase, 1 lowercase, 1 number

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "johndoe",
      "bio": null,
      "avatar": null,
      "role": "USER",
      "createdAt": "2026-01-14T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Email already exists
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Email already registered"
  }
}

// 400 Bad Request - Username already exists
{
  "success": false,
  "error": {
    "code": "USERNAME_EXISTS",
    "message": "Username already taken"
  }
}

// 400 Bad Request - Validation failed
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

---

### 1.2. Log in

**Endpoint:** `POST /auth/login`

**Access:** Public

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "johndoe",
      "bio": "Software developer and writer",
      "avatar": null,
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

```json
// 401 Unauthorized
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}

// 403 Forbidden - Account inactive
{
  "success": false,
  "error": {
    "code": "ACCOUNT_INACTIVE",
    "message": "Your account has been deactivated"
  }
}
```

---

### 1.3. Refresh Token

**Endpoint:** `POST /auth/refresh`

**Access:** Authenticated

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 2. Users

### 2.1. Get the current user’s profile

**Endpoint:** `GET /user`

**Access:** Authenticated (USER, ADMIN)

**Note:** Singular `/user` endpoint represents the current authenticated user (REST best practice)

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "bio": "Software developer and writer",
    "avatar": "https://example.com/avatars/johndoe.jpg",
    "role": "USER",
    "followersCount": 150,
    "followingCount": 75,
    "articlesCount": 25,
    "createdAt": "2026-01-14T10:30:00.000Z"
  }
}
```

---

### 2.2. Update the current user’s profile

**Endpoint:** `PUT /user`

**Access:** Authenticated (USER, ADMIN)

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "username": "johndoe_updated", // Optional
  "bio": "Updated bio", // Optional
  "avatar": "https://example.com/new-avatar.jpg", // Optional - URL to avatar image (max 1000 chars)
  "password": "NewPassword123!" // Optional
}
```

**Note about Avatar:**

- Avatar must be a valid URL (max 1000 characters)
- Points to external storage (S3, CDN)
- DO NOT upload binary/blob to this endpoint
- **TODO:** The POST /user/avatar endpoint for file uploads will be implemented later

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe_updated",
    "bio": "Updated bio",
    "avatar": "https://example.com/new-avatar.jpg",
    "role": "USER",
    "updatedAt": "2026-01-14T11:00:00.000Z"
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Username taken
{
  "success": false,
  "error": {
    "code": "USERNAME_EXISTS",
    "message": "Username already taken"
  }
}
```

---

### 2.3. Get the public profile by username

**Endpoint:** `GET /profiles/:username`

**Access:** Authenticated (USER, ADMIN)

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "username": "johndoe",
    "bio": "Software developer and writer",
    "avatar": "https://example.com/avatars/johndoe.jpg",
    "followersCount": 150,
    "articlesCount": 25,
    "following": false // If authenticated, check whether the current user is following
  }
}
```

---

## 3. Articles

### 3.1. Get the list of articles (Public)

**Endpoint:** `GET /articles`

**Access:** Public

**Query Parameters:**

```
?limit=20          // Default: 20, Max: 99
&offset=0          // Default: 0
&tag=javascript    // Filter by tag slug (optional)
&author=johndoe    // Filter by author username (optional)
&favorited=janedoe // Filter by who favorited (optional)
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": 1,
        "slug": "how-to-learn-nestjs",
        "title": "How to Learn NestJS",
        "description": "A comprehensive guide to learning NestJS framework",
        "body": "Full article content here...",
        "tags": [
          {
            "id": 1,
            "name": "NestJS",
            "slug": "nestjs"
          },
          {
            "id": 2,
            "name": "Backend",
            "slug": "backend"
          }
        ],
        "author": {
          "username": "johndoe",
          "bio": "Software developer and writer",
          "avatar": "https://example.com/avatars/johndoe.jpg",
          "following": false
        },
        "favoritesCount": 45,
        "commentsCount": 12,
        "favorited": false, // True if the current user has favorited (requires authentication)
        "createdAt": "2026-01-14T10:00:00.000Z",
        "updatedAt": "2026-01-14T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "hasNext": true
    }
  }
}
```

---

### 3.2. Get feed articles (Authenticated)

**Endpoint:** `GET /articles/feed`

**Access:** Authenticated

**Description:** Get articles from the users that the current user is following

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

```
?limit=20   // Default: 20, Max: 99
&offset=0   // Default: 0
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "articles": [
      // Same structure as /articles
    ],
    "pagination": {
      "total": 35,
      "limit": 20,
      "offset": 0,
      "hasNext": true
    }
  }
}
```

---

### 3.3. Get article details

**Endpoint:** `GET /articles/:slug`

**Access:** Public

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "how-to-learn-nestjs",
    "title": "How to Learn NestJS",
    "description": "A comprehensive guide to learning NestJS framework",
    "body": "Full article content here...",
    "tags": [
      {
        "id": 1,
        "name": "NestJS",
        "slug": "nestjs"
      }
    ],
    "author": {
      "id": 1,
      "username": "johndoe",
      "bio": "Software developer and writer",
      "avatar": "https://example.com/avatars/johndoe.jpg",
      "followersCount": 150,
      "following": false
    },
    "favoritesCount": 45,
    "commentsCount": 12,
    "favorited": false,
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z"
  }
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "success": false,
  "error": {
    "code": "ARTICLE_NOT_FOUND",
    "message": "Article not found"
  }
}
```

---

### 3.4. Create an article

**Endpoint:** `POST /articles`

**Access:** Authenticated (USER, ADMIN)

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "How to Learn NestJS",
  "description": "A comprehensive guide to learning NestJS framework",
  "body": "Full article content here...",
  "tags": ["nestjs", "backend", "typescript"], // Tag slugs
  "isPublished": true // Optional, default: true
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "how-to-learn-nestjs",
    "title": "How to Learn NestJS",
    "description": "A comprehensive guide to learning NestJS framework",
    "body": "Full article content here...",
    "tags": [
      {
        "id": 1,
        "name": "NestJS",
        "slug": "nestjs"
      }
    ],
    "author": {
      "username": "johndoe",
      "bio": "Software developer and writer",
      "avatar": "https://example.com/avatars/johndoe.jpg"
    },
    "favoritesCount": 0,
    "commentsCount": 0,
    "favorited": false,
    "isPublished": true,
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z"
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Validation error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  }
}

// 400 Bad Request - Slug already exists
{
  "success": false,
  "error": {
    "code": "SLUG_EXISTS",
    "message": "An article with similar title already exists"
  }
}
```

---

### 3.5. Update article

**Endpoint:** `PUT /articles/:id`

**Access:** Authenticated (Author only)

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "title": "Updated Title", // Optional
  "description": "Updated description", // Optional
  "body": "Updated content...", // Optional
  "tags": ["nestjs", "typescript"], // Optional
  "isPublished": false // Optional
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    // Same structure as create article
    "updatedAt": "2026-01-14T11:00:00.000Z"
  }
}
```

**Error Responses:**

```json
// 403 Forbidden - Not owner
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You can only update your own articles"
  }
}

// 404 Not Found
{
  "success": false,
  "error": {
    "code": "ARTICLE_NOT_FOUND",
    "message": "Article not found"
  }
}
```

---

### 3.6. Delete an article

**Endpoint:** `DELETE /articles/:id`

**Access:** Authenticated (Author or ADMIN)

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Article deleted successfully"
}
```

**Error Responses:**

```json
// 403 Forbidden
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You can only delete your own articles"
  }
}
```

---

## 4. Comments

### 4.1. Get list of comments for an article

**Endpoint:** `GET /articles/:id/comments`

**Access:** Public

**Query Parameters:**

```
?limit=20   // Default: 20
&offset=0   // Default: 0
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 1,
        "body": "Great article! Very helpful.",
        "author": {
          "username": "janedoe",
          "avatar": "https://example.com/avatars/janedoe.jpg",
          "following": false
        },
        "createdAt": "2026-01-14T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 12,
      "limit": 20,
      "offset": 0,
      "hasNext": false
    }
  }
}
```

---

### 4.2. Add a comment to the article

**Endpoint:** `POST /articles/:id/comments`

**Access:** Authenticated

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "body": "Great article! Very helpful."
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "body": "Great article! Very helpful.",
    "author": {
      "username": "johndoe",
      "avatar": "https://example.com/avatars/johndoe.jpg"
    },
    "articleId": 1,
    "createdAt": "2026-01-14T10:30:00.000Z"
  }
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "success": false,
  "error": {
    "code": "ARTICLE_NOT_FOUND",
    "message": "Article not found"
  }
}

// 400 Bad Request
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Comment body is required"
  }
}
```

---

### 4.3. Delete a comment

**Endpoint:** `DELETE /articles/:id/comments/:commentId`

**Access:** Authenticated (Comment author or ADMIN)

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

**Error Responses:**

```json
// 403 Forbidden
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You can only delete your own comments"
  }
}

// 404 Not Found
{
  "success": false,
  "error": {
    "code": "COMMENT_NOT_FOUND",
    "message": "Comment not found"
  }
}
```

---

## 5. Tags

### 5.1. Get list of all tags

**Endpoint:** `GET /tags`

**Access:** Public

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": 1,
        "name": "NestJS",
        "slug": "nestjs",
        "articlesCount": 25
      },
      {
        "id": 2,
        "name": "JavaScript",
        "slug": "javascript",
        "articlesCount": 150
      },
      {
        "id": 3,
        "name": "TypeScript",
        "slug": "typescript",
        "articlesCount": 100
      }
    ]
  }
}
```

---

### 5.2. Get tag and article information

**Endpoint:** `GET /tags/:slug`

**Access:** Public

**Query Parameters:**

```
?limit=20
&offset=0
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "tag": {
      "id": 1,
      "name": "NestJS",
      "slug": "nestjs",
      "articlesCount": 25
    },
    "articles": [
      // Same structure as /articles
    ],
    "pagination": {
      "total": 25,
      "limit": 20,
      "offset": 0,
      "hasNext": true
    }
  }
}
```

---

## 6. Favorites

### 6.1. Favorite article

**Endpoint:** `POST /articles/:id/favorite`

**Access:** Authenticated

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "article": {
      "slug": "how-to-learn-nestjs",
      "title": "How to Learn NestJS",
      "favorited": true,
      "favoritesCount": 46
    }
  }
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "success": false,
  "error": {
    "code": "ARTICLE_NOT_FOUND",
    "message": "Article not found"
  }
}
```

---

### 6.2. Unfavorite article

**Endpoint:** `DELETE /articles/:id/favorite`

**Access:** Authenticated

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "article": {
      "slug": "how-to-learn-nestjs",
      "title": "How to Learn NestJS",
      "favorited": false,
      "favoritesCount": 45
    }
  }
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "success": false,
  "error": {
    "code": "ARTICLE_NOT_FOUND",
    "message": "Article not found"
  }
}
```

---

## 7. Follows

### 7.1. Follow user

**Endpoint:** `POST /profiles/:username/follow`

**Access:** Authenticated

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "profile": {
      "username": "janedoe",
      "bio": "Writer and photographer",
      "avatar": "https://example.com/avatars/janedoe.jpg",
      "following": true,
      "followersCount": 201
    }
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Cannot follow yourself
{
  "success": false,
  "error": {
    "code": "CANNOT_FOLLOW_SELF",
    "message": "You cannot follow yourself"
  }
}

// 404 Not Found
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```

---

### 7.2. Unfollow user

**Endpoint:** `DELETE /profiles/:username/follow`

**Access:** Authenticated

**Headers:**

```
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "profile": {
      "username": "janedoe",
      "bio": "Writer and photographer",
      "avatar": "https://example.com/avatars/janedoe.jpg",
      "following": false,
      "followersCount": 200
    }
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Cannot follow yourself
{
  "success": false,
  "error": {
    "code": "CANNOT_FOLLOW_SELF",
    "message": "You cannot follow yourself"
  }
}

// 404 Not Found
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```

---

## Common Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to perform this action"
  }
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Rate Limiting

- **Public endpoints:** 100 requests per 15 minutes per IP
- **Authenticated endpoints:** 300 requests per 15 minutes per user
- **Write operations (POST, PUT, DELETE):** 60 requests per 15 minutes per user

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705233600
```

---

## Pagination

All endpoints that return lists support pagination with:

- `limit`: Number of items per page (default: 20, max: 99)
- `offset`: Number of items to skip (default: 0)

Response pagination format:

```json
{
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Sorting

Some endpoints support sorting:

**Articles:**

- `?sort=createdAt` (default)
- `?sort=favoritesCount`
- `?sort=commentsCount`
- `?order=desc` (default) or `?order=asc`

Example: `GET /articles?sort=favoritesCount&order=desc&limit=10`

---

## Filtering

**Articles filtering:**

```
GET /articles?tag=javascript&author=johndoe&favorited=janedoe
```

**Filter own articles (use current username):**

```
GET /articles?author={current_username}&isPublished=false  // Draft articles
```

---

## Implementation Notes

### Security

1. **JWT Token:** Expires after 7 days
2. **Password:** Hashed with bcrypt, cost factor 10
3. **Rate limiting:** Implemented with Redis
4. **CORS:** Configured for the production domain

### Performance

1. **Caching:** Cache popular articles and tags with Redis (5-minute TTL)
2. **Database indexes:** Defined in the schema
3. **Pagination:** Always use a limit to avoid querying too much data
4. **Denormalization:** `favoritesCount`, `commentsCount`, `followersCount` to optimize queries

### Data Validation

1. **DTO Classes:** Use class-validator in NestJS
2. **Global Validation Pipe:** Enabled in main.ts
3. **Transform:** Automatically transform query parameters

### Error Handling

1. **Global Exception Filter:** Centralized error handling
2. **Custom Exceptions:** BusinessException, ValidationException
3. **Logging:** Log all errors with Winston

---

## Testing Checklist

### Authentication Tests

- [ ] Register with valid data
- [ ] Register with duplicate email
- [ ] Register with duplicate username
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Access protected route without token
- [ ] Access protected route with invalid token

### Articles Tests

- [ ] Create article with valid data
- [ ] Create article with duplicate slug
- [ ] Update own article
- [ ] Update another user’s article (should fail for USER)
- [ ] Delete own article
- [ ] Delete another user’s article (should fail for USER, succeed for ADMIN)
- [ ] List articles with pagination
- [ ] Filter articles by tag
- [ ] Filter articles by author

### Comments Tests

- [ ] Create comment with valid data
- [ ] Create comment without auth (should fail)
- [ ] Delete own comment
- [ ] Delete another user’s comment (should fail for USER, succeed for ADMIN)
- [ ] List comments with pagination

### Favorites Tests

- [ ] Favorite article
- [ ] Unfavorite article
- [ ] Check favoritesCount increment/decrement

### Follows Tests

- [ ] Follow user
- [ ] Follow yourself (should fail)
- [ ] Unfollow user

---

## Deployment Considerations

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/blog"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="production"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# CORS
CORS_ORIGIN="https://yourdomain.com"
```

### Docker Setup

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: blog
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---
