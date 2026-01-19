import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create connection pool for Prisma 7.x
const connectionString: string | undefined = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const pool: Pool = new Pool({ connectionString });
const adapter: PrismaPg = new PrismaPg(pool);

// Initialize Prisma Client with adapter
const prisma: PrismaClient = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // Seed tags
  const tags = [
    { name: 'JavaScript', slug: 'javascript' },
    { name: 'TypeScript', slug: 'typescript' },
    { name: 'NestJS', slug: 'nestjs' },
    { name: 'Node.js', slug: 'nodejs' },
    { name: 'React', slug: 'react' },
    { name: 'Vue.js', slug: 'vuejs' },
    { name: 'Angular', slug: 'angular' },
    { name: 'Web Development', slug: 'web-development' },
    { name: 'Backend', slug: 'backend' },
    { name: 'Frontend', slug: 'frontend' },
    { name: 'Database', slug: 'database' },
    { name: 'PostgreSQL', slug: 'postgresql' },
    { name: 'DevOps', slug: 'devops' },
    { name: 'Tutorial', slug: 'tutorial' },
    { name: 'Best Practices', slug: 'best-practices' },
    { name: 'Architecture', slug: 'architecture' },
    { name: 'API Design', slug: 'api-design' },
    { name: 'Testing', slug: 'testing' },
    { name: 'Security', slug: 'security' },
    { name: 'Performance', slug: 'performance' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
    console.log(`✓ Created tag: ${tag.name}`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Close connection pool
  });
