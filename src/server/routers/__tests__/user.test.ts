import { describe, it, expect } from 'vitest';
import { createCaller } from '../_app';
import { createTestContext } from '../../__tests__/helpers/context';
import { createTestUser } from '../../__tests__/helpers/db';

describe('userRouter', () => {
  describe('sync', () => {
    it('should return user when authenticated', async () => {
      const user = await createTestUser({
        username: 'testuser',
        name: 'Test User',
      });

      const ctx = await createTestContext(user.id);
      const caller = createCaller(ctx);

      const result = await caller.user.sync();

      expect(result).toBeDefined();
      expect(result?.id).toBe(user.id);
      expect(result?.username).toBe('testuser');
      expect(result?.name).toBe('Test User');
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = await createTestContext(null);
      const caller = createCaller(ctx);

      await expect(caller.user.sync()).rejects.toThrow('UNAUTHORIZED');
    });

    it('should return null for non-existing user', async () => {
      const ctx = await createTestContext('non-existing-user-id');
      const caller = createCaller(ctx);

      const result = await caller.user.sync();

      expect(result).toBeNull();
    });
  });
});
