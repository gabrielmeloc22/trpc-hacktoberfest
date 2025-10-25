import { router, protectedProcedure } from '../trpc';
import { prisma } from '~/server/prisma';

export const userRouter = router({
  sync: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
    });

    return user;
  }),
});
