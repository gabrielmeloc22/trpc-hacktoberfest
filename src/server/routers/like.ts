import { router, protectedProcedure, publicProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

export const likeRouter = router({
  toggle: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { postId } = input;
      const userId = ctx.userId;

      // Usa transação para garantir consistência em casos concorrentes
      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.like.findUnique({
          where: {
            userId_postId: { userId, postId },
          },
        });

        if (existing) {
          await tx.like.delete({
            where: { userId_postId: { userId, postId } },
          });
          return { liked: false };
        }

        await tx.like.create({
          data: { userId, postId },
        });
        return { liked: true };
      });

      return result;
    }),

  byPost: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input, ctx }) => {
      const like = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: ctx.userId,
            postId: input.postId,
          },
        },
      });
      return { liked: !!like };
    }),

  byPosts: publicProcedure
    .input(z.object({ postIds: z.array(z.string()) }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) {
        return {};
      }

      const likes = await prisma.like.findMany({
        where: {
          userId: ctx.userId,
          postId: { in: input.postIds },
        },
        select: { postId: true },
      });

      const likedPosts = likes.reduce(
        (acc, like) => {
          acc[like.postId] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      );

      return likedPosts;
    }),
});
