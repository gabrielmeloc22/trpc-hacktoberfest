/**
 * Adds seed data to your db
 *
 * @see https://www.prisma.io/docs/guides/database/seed-database
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const systemUserId = '00000000-0000-0000-0000-000000000000';

  const systemUser = await prisma.user.upsert({
    where: { id: systemUserId },
    create: {
      id: systemUserId,
      clerkId: 'system',
      username: 'system',
      name: 'System',
    },
    update: {},
  });

  const firstPostId = '5c03994c-fc16-47e0-bd02-d218a370a078';
  await prisma.post.upsert({
    where: {
      id: firstPostId,
    },
    create: {
      id: firstPostId,
      text: 'This is an example post generated from `prisma/seed.ts`',
      userId: systemUser.id,
    },
    update: {},
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
