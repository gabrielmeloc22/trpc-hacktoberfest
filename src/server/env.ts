/**
 * This file is included in `/next.config.ts` which ensures the app isn't built with invalid env vars.
 * It has to be a `.js`-file to be imported there.
 */

import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_SECRET_KEY: z.string(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  throw new Error(
    '❌ Invalid environment variables: ' +
      JSON.stringify(_env.error.format(), null, 4),
  );
}
export const env = _env.data;
