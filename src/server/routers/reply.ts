import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import type { Prisma } from '@prisma/client';

const defaultReplySelect = {
  id: true,
  text: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  postId: true,
  user: {
    select: {
      id: true,
      clerkId: true,
      username: true,
      name: true,
      imageUrl: true,
    },
  },
} satisfies Prisma.ReplySelect;

export const replyRouter = router({
  list: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input }) => {
      const replies = await prisma.reply.findMany({
        where: { postId: input.postId },
        select: defaultReplySelect,
        orderBy: { createdAt: 'asc' },
      });
      return replies;
    }),

  add: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        text: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const reply = await prisma.reply.create({
        data: {
          text: input.text,
          postId: input.postId,
          userId: ctx.userId,
        },
        select: defaultReplySelect,
      });
      return reply;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const reply = await prisma.reply.findUnique({
        where: { id: input.id },
      });

      if (!reply) {
        throw new Error('Reply not found');
      }

      if (reply.userId !== ctx.userId) {
        throw new Error('Unauthorized');
      }

      await prisma.reply.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
