import type * as trpcNext from '@trpc/server/adapters/next';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from './prisma';

interface CreateContextOptions {
  userId: string | null;
}

export async function createContextInner(opts: CreateContextOptions) {
  return {
    userId: opts.userId,
  };
}

export type Context = Awaited<ReturnType<typeof createContextInner>>;

export async function createContext(
  opts: trpcNext.CreateNextContextOptions,
): Promise<Context> {
  const { userId: clerkId } = getAuth(opts.req);

  if (!clerkId) {
    return createContextInner({
      userId: null,
    });
  }

  let user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);

    user = await prisma.user.create({
      data: {
        clerkId,
        username: clerkUser.username ?? undefined,
        name:
          `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() ||
          undefined,
        imageUrl: clerkUser.imageUrl,
      },
      select: { id: true },
    });
  }

  return createContextInner({
    userId: user.id,
  });
}
