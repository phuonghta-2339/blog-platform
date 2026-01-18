# Database Schema - Blog Platform (Medium Clone)

## Entity Relationship Diagram

This diagram is designed for Prisma ORM and can be visualized on [dbdiagram.io](https://dbdiagram.io)

```dbml
// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

Table users {
  id integer [primary key, increment]
  email varchar(255) [unique, not null]
  username varchar(100) [unique, not null]
  password varchar(255) [not null, note: 'Hashed password']
  role varchar(20) [not null, default: 'USER', note: 'ADMIN or USER']
  bio text [null]
  avatar varchar(1000) [null, note: 'URL to avatar image (CDN/S3), not binary data']
  is_active boolean [default: true, note: 'Soft delete flag']
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]

  Indexes {
    email [unique]
    username [unique]
  }
}

Table articles {
  id integer [primary key, increment]
  slug varchar(255) [unique, not null, note: 'URL-friendly unique identifier']
  title varchar(255) [not null]
  description text [not null, note: 'Short description/excerpt']
  body text [not null, note: 'Full article content']
  author_id integer [not null, ref: > users.id]
  favorites_count integer [default: 0, note: 'Denormalized count for performance']
  comments_count integer [default: 0, note: 'Denormalized count for performance']
  is_published boolean [default: true]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]

  Indexes {
    slug [unique]
    author_id
    created_at
    (is_published, created_at) [name: 'published_recent']
  }
}

Table comments {
  id integer [primary key, increment]
  body text [not null]
  article_id integer [not null, ref: > articles.id]
  author_id integer [not null, ref: > users.id]
  created_at timestamp [default: `now()`]

  Indexes {
    article_id
    author_id
    (article_id, created_at) [name: 'article_comments_recent']
  }
}

Table tags {
  id integer [primary key, increment]
  name varchar(50) [unique, not null]
  slug varchar(50) [unique, not null]
  created_at timestamp [default: `now()`]

  Indexes {
    name [unique]
    slug [unique]
  }
}

// Junction table for many-to-many relationship between articles and tags
Table article_tags {
  id integer [primary key, increment]
  article_id integer [not null, ref: > articles.id]
  tag_id integer [not null, ref: > tags.id]
  created_at timestamp [default: `now()`]

  Indexes {
    (article_id, tag_id) [unique, name: 'unique_article_tag']
    article_id
    tag_id
  }
}

// Junction table for favorites (many-to-many between users and articles)
Table favorites {
  id integer [primary key, increment]
  user_id integer [not null, ref: > users.id]
  article_id integer [not null, ref: > articles.id]
  created_at timestamp [default: `now()`]

  Indexes {
    (user_id, article_id) [unique, name: 'unique_user_article_favorite']
    user_id
    article_id
  }
}

// Junction table for follows (many-to-many self-referencing on users)
Table follows {
  id integer [primary key, increment]
  follower_id integer [not null, ref: > users.id, note: 'User who follows']
  following_id integer [not null, ref: > users.id, note: 'User being followed']
  created_at timestamp [default: `now()`]

  Indexes {
    (follower_id, following_id) [unique, name: 'unique_follow_relationship']
    follower_id
    following_id
  }
}
```

## Relationships Summary

### User Relationships

- **1 User → N Articles** (author)
- **1 User → N Comments** (author)
- **N Users ↔ N Articles** (favorites - many-to-many)
- **N Users ↔ N Users** (follows - self-referencing many-to-many)

### Article Relationships

- **1 Article → 1 User** (author)
- **1 Article → N Comments**
- **N Articles ↔ N Tags** (many-to-many via article_tags)
- **N Articles ↔ N Users** (favorites - many-to-many)

### Comment Relationships

- **1 Comment → 1 User** (author)
- **1 Comment → 1 Article**

### Tag Relationships

- **N Tags ↔ N Articles** (many-to-many via article_tags)

## Database Constraints & Business Rules

### Users Table

- ✅ Email must be unique and valid
- ✅ Username must be unique (3-50 characters)
- ✅ Password must be hashed (bcrypt/argon2)
- ✅ Role: only ADMIN or USER
- ✅ Avatar must be a valid URL (max 1000 chars) pointing to external storage (S3/CDN)
- ✅ Soft delete via `is_active` flag
- ❌ No hard delete
- ❌ Do not store binary image data in database

### Articles Table

- ✅ Slug must be unique and URL-friendly (auto-generate from title)
- ✅ Author must exist (foreign key constraint)
- ✅ Denormalized counts (`favorites_count`, `comments_count`) to optimize performance
- ✅ Cascade delete comments when article is deleted
- ✅ `is_published` to support draft functionality

### Comments Table

- ✅ No update (immutable after creation)
- ✅ Cascade delete when article or user is deleted
- ✅ Only author or admin can delete

### Tags Table

- ✅ Seeded data only
- ✅ No CRUD operations from users
- ✅ Name and slug must be unique

### Favorites Table

- ✅ Composite unique constraint (user_id, article_id)
- ✅ When adding favorite → increment `articles.favorites_count`
- ✅ When removing favorite → decrement `articles.favorites_count`
- ✅ Cascade delete when user or article is deleted

### Follows Table

- ✅ Composite unique constraint (follower_id, following_id)
- ✅ Cannot follow yourself: `follower_id != following_id`
- ✅ Cascade delete when user is deleted

## Indexes Strategy

### Performance Optimization

1. **Articles**: Index on `author_id`, `created_at`, `is_published`
2. **Comments**: Composite index on `(article_id, created_at)` for pagination
3. **Favorites**: Index on both `user_id` and `article_id` for bidirectional queries
4. **Follows**: Index on both `follower_id` and `following_id`
5. **Article_Tags**: Index on both `article_id` and `tag_id`

## Avatar Storage Strategy

**Avatar field stores URL string (max 1000 chars), NOT binary image data.**

**Rationale:**

- ✅ Database queries faster (no large blobs)
- ✅ Scalability via CDN/S3
- ✅ Cost-effective storage
- ✅ Global caching capabilities

**TODO:** Detailed upload implementation guide (Cloudinary/S3 integration, validation, file handling) will be added when implementing avatar upload feature.

```typescript
// Simple validation example
@IsOptional()
@IsString()
@IsUrl()
@MaxLength(1000)
avatar?: string;
```

---

## Migration Notes

### Seed Data Required

- **Tags**: Need to seed at least 10-20 popular tags
  - Technology, Programming, JavaScript, TypeScript, NestJS
  - Web Development, Backend, Frontend, DevOps, Database
  - Career, Tutorial, Best Practices, etc.

### Initial Admin User

```sql
-- Create default admin user
INSERT INTO users (email, username, password, role, bio, is_active)
VALUES (
  'admin@blog.com',
  'admin',
  '$hashed_password', -- Hash of 'Admin@123'
  'ADMIN',
  'System Administrator',
  true
);
```

## Prisma Schema Mapping

To use with Prisma, create file `prisma/schema.prisma`:

```prisma
// This is your Prisma schema file

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  USER
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique @db.VarChar(255)
  username  String   @unique @db.VarChar(100)
  password  String   @db.VarChar(255)
  role      Role     @default(USER)
  bio       String?  @db.Text
  avatar    String?  @db.VarChar(1000) // URL to avatar image on CDN/S3
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  articles   Article[]
  comments   Comment[]
  favorites  Favorite[]
  followers  Follow[]   @relation("UserFollowers")
  following  Follow[]   @relation("UserFollowing")

  @@index([email])
  @@index([username])
  @@map("users")
}

model Article {
  id             Int      @id @default(autoincrement())
  slug           String   @unique @db.VarChar(255)
  title          String   @db.VarChar(255)
  description    String   @db.Text
  body           String   @db.Text
  authorId       Int      @map("author_id")
  favoritesCount Int      @default(0) @map("favorites_count")
  commentsCount  Int      @default(0) @map("comments_count")
  isPublished    Boolean  @default(true) @map("is_published")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  author   User          @relation(fields: [authorId], references: [id])
  comments Comment[]
  tags     ArticleTag[]
  favorites Favorite[]

  @@index([slug])
  @@index([authorId])
  @@index([createdAt])
  @@index([isPublished, createdAt], name: "published_recent")
  @@map("articles")
}

model Comment {
  id        Int      @id @default(autoincrement())
  body      String   @db.Text
  articleId Int      @map("article_id")
  authorId  Int      @map("author_id")
  createdAt DateTime @default(now()) @map("created_at")

  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  author  User    @relation(fields: [authorId], references: [id])

  @@index([articleId])
  @@index([authorId])
  @@index([articleId, createdAt], name: "article_comments_recent")
  @@map("comments")
}

model Tag {
  id        Int      @id @default(autoincrement())
  name      String   @unique @db.VarChar(50)
  slug      String   @unique @db.VarChar(50)
  createdAt DateTime @default(now()) @map("created_at")

  articles ArticleTag[]

  @@index([name])
  @@index([slug])
  @@map("tags")
}

model ArticleTag {
  id        Int      @id @default(autoincrement())
  articleId Int      @map("article_id")
  tagId     Int      @map("tag_id")
  createdAt DateTime @default(now()) @map("created_at")

  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  tag     Tag     @relation(fields: [tagId], references: [id])

  @@unique([articleId, tagId], name: "unique_article_tag")
  @@index([articleId])
  @@index([tagId])
  @@map("article_tags")
}

model Favorite {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  articleId Int      @map("article_id")
  createdAt DateTime @default(now()) @map("created_at")

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([userId, articleId], name: "unique_user_article_favorite")
  @@index([userId])
  @@index([articleId])
  @@map("favorites")
}

model Follow {
  id          Int      @id @default(autoincrement())
  followerId  Int      @map("follower_id")
  followingId Int      @map("following_id")
  createdAt   DateTime @default(now()) @map("created_at")

  follower  User @relation("UserFollowers", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("UserFollowing", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId], name: "unique_follow_relationship")
  @@index([followerId])
  @@index([followingId])
  @@map("follows")
}
```

## Database Setup Commands

```bash
# Install Prisma
npm install -D prisma
npm install @prisma/client

# Initialize Prisma
npx prisma init

# Create migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed database
npx prisma db seed
```
