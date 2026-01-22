import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { seedTags } from './seeds/tags.seed';

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
  console.log('🌱 Start seeding...\n');

  // Seed tags with comprehensive data
  await seedTags(prisma);

  console.log('\n✅ Seeding completed successfully!');
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
