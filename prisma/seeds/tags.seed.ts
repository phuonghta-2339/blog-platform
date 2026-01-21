import { PrismaClient } from '@prisma/client';

/**
 * Comprehensive tag list organized by categories
 * Total: 50+ tags covering various programming topics
 */
export const tagsSeedData = [
  // Programming Languages (12)
  { name: 'JavaScript', slug: 'javascript' },
  { name: 'TypeScript', slug: 'typescript' },
  { name: 'Python', slug: 'python' },
  { name: 'Java', slug: 'java' },
  { name: 'C#', slug: 'csharp' },
  { name: 'Go', slug: 'go' },
  { name: 'Rust', slug: 'rust' },
  { name: 'PHP', slug: 'php' },
  { name: 'Ruby', slug: 'ruby' },
  { name: 'Swift', slug: 'swift' },
  { name: 'Kotlin', slug: 'kotlin' },
  { name: 'Dart', slug: 'dart' },

  // Frontend Frameworks & Libraries (10)
  { name: 'React', slug: 'react' },
  { name: 'Vue.js', slug: 'vuejs' },
  { name: 'Angular', slug: 'angular' },
  { name: 'Next.js', slug: 'nextjs' },
  { name: 'Nuxt.js', slug: 'nuxtjs' },
  { name: 'Svelte', slug: 'svelte' },
  { name: 'Remix', slug: 'remix' },
  { name: 'Astro', slug: 'astro' },
  { name: 'Tailwind CSS', slug: 'tailwind' },
  { name: 'CSS', slug: 'css' },

  // Backend Frameworks (8)
  { name: 'NestJS', slug: 'nestjs' },
  { name: 'Node.js', slug: 'nodejs' },
  { name: 'Express.js', slug: 'expressjs' },
  { name: 'Django', slug: 'django' },
  { name: 'FastAPI', slug: 'fastapi' },
  { name: 'Spring Boot', slug: 'spring-boot' },
  { name: 'Laravel', slug: 'laravel' },
  { name: 'Ruby on Rails', slug: 'rails' },

  // Databases (8)
  { name: 'PostgreSQL', slug: 'postgresql' },
  { name: 'MySQL', slug: 'mysql' },
  { name: 'MongoDB', slug: 'mongodb' },
  { name: 'Redis', slug: 'redis' },
  { name: 'Prisma', slug: 'prisma' },
  { name: 'GraphQL', slug: 'graphql' },
  { name: 'SQL', slug: 'sql' },
  { name: 'NoSQL', slug: 'nosql' },

  // DevOps & Tools (10)
  { name: 'Docker', slug: 'docker' },
  { name: 'Kubernetes', slug: 'kubernetes' },
  { name: 'CI/CD', slug: 'cicd' },
  { name: 'Git', slug: 'git' },
  { name: 'AWS', slug: 'aws' },
  { name: 'Azure', slug: 'azure' },
  { name: 'Google Cloud', slug: 'gcp' },
  { name: 'DevOps', slug: 'devops' },
  { name: 'Linux', slug: 'linux' },
  { name: 'Nginx', slug: 'nginx' },

  // Development Concepts & Practices (12)
  { name: 'API Design', slug: 'api-design' },
  { name: 'REST API', slug: 'rest-api' },
  { name: 'Microservices', slug: 'microservices' },
  { name: 'Testing', slug: 'testing' },
  { name: 'Security', slug: 'security' },
  { name: 'Performance', slug: 'performance' },
  { name: 'Architecture', slug: 'architecture' },
  { name: 'Design Patterns', slug: 'design-patterns' },
  { name: 'Clean Code', slug: 'clean-code' },
  { name: 'Best Practices', slug: 'best-practices' },
  { name: 'Agile', slug: 'agile' },
  { name: 'Scrum', slug: 'scrum' },

  // General Categories (5)
  { name: 'Web Development', slug: 'web-development' },
  { name: 'Mobile Development', slug: 'mobile-development' },
  { name: 'Frontend', slug: 'frontend' },
  { name: 'Backend', slug: 'backend' },
  { name: 'Full Stack', slug: 'fullstack' },

  // Learning & Career (5)
  { name: 'Tutorial', slug: 'tutorial' },
  { name: 'Beginner', slug: 'beginner' },
  { name: 'Advanced', slug: 'advanced' },
  { name: 'Career', slug: 'career' },
  { name: 'Interview', slug: 'interview' },
];

/**
 * Seed tags with upsert logic for idempotency
 * @param prisma - PrismaClient instance
 */
export async function seedTags(prisma: PrismaClient): Promise<void> {
  console.log('Seeding tags...');

  // Get existing tags before upserting for accurate tracking
  const existingTags = await prisma.tag.findMany({
    select: { slug: true },
  });
  const existingSlugs = new Set(existingTags.map((t) => t.slug));

  let successCount = 0;
  let skippedCount = 0;

  for (const tag of tagsSeedData) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });

    if (existingSlugs.has(tag.slug)) {
      skippedCount++;
    } else {
      successCount++;
    }
  }

  console.log(
    `✅ Tags seeded: ${successCount} created, ${skippedCount} already existed`,
  );
  console.log(`Total tags in database: ${tagsSeedData.length}`);
}
