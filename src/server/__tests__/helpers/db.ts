import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let prisma: PrismaClient;

export function getTestPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    const prismaGlobal = globalThis as typeof globalThis & {
      prisma?: PrismaClient;
    };
    prismaGlobal.prisma = prisma;
  }
  return prisma;
}

export async function resetDatabase() {
  const prisma = getTestPrisma();

  await prisma.reply.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
}

export async function runMigrations() {
  try {
    await execAsync('npx prisma migrate deploy');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
  }
}

export async function createTestUser(data?: {
  clerkId?: string;
  username?: string;
  name?: string;
  imageUrl?: string;
}) {
  const prisma = getTestPrisma();
  return prisma.user.create({
    data: {
      clerkId: data?.clerkId ?? `test-clerk-${Date.now()}-${Math.random()}`,
      username: data?.username ?? `testuser${Date.now()}`,
      name: data?.name ?? 'Test User',
      imageUrl: data?.imageUrl ?? 'https://example.com/avatar.jpg',
    },
  });
}

export async function createTestPost(userId: string, text?: string) {
  const prisma = getTestPrisma();
  return prisma.post.create({
    data: {
      text: text ?? 'Test post content',
      userId,
    },
  });
}
