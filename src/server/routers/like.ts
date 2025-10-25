import { router, protectedProcedure, publicProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

export const likeRouter = router({
  toggle: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const postId  = input.postId;
      const userId = ctx.userId;

      // Verifica se o like já existe
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      if (existingLike) {
        // Se o like existe, remove ele
        await prisma.like.delete({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
        });
        return { liked: false };
      } else {
        // Se o like não existe, cria um novo
        await prisma.like.create({
          data: {
            userId,
            postId,
          },
        });
        return { liked: true };
      }
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
