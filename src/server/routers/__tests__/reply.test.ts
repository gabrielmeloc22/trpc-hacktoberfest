import { describe, it, expect } from 'vitest';
import { createCaller } from '../_app';
import { createTestContext } from '../../__tests__/helpers/context';
import {
  createTestUser,
  createTestPost,
  getTestPrisma,
} from '../../__tests__/helpers/db';

describe('replyRouter', () => {
  describe('list', () => {
    it('should return empty array when no replies exist', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      const ctx = await createTestContext();
      const caller = createCaller(ctx);

      const result = await caller.reply.list({ postId: post.id });

      expect(result).toEqual([]);
    });

    it('should return replies for a post ordered by createdAt asc', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      const reply1 = await getTestPrisma().reply.create({
        data: {
          text: 'First reply',
          postId: post.id,
          userId: user.id,
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const reply2 = await getTestPrisma().reply.create({
        data: {
          text: 'Second reply',
          postId: post.id,
          userId: user.id,
        },
      });

      const ctx = await createTestContext();
      const caller = createCaller(ctx);

      const result = await caller.reply.list({ postId: post.id });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(reply1.id);
      expect(result[0].text).toBe('First reply');
      expect(result[1].id).toBe(reply2.id);
      expect(result[1].text).toBe('Second reply');
    });

    it('should only return replies for specified post', async () => {
      const user = await createTestUser();
      const post1 = await createTestPost(user.id, 'Post 1');
      const post2 = await createTestPost(user.id, 'Post 2');

      await getTestPrisma().reply.create({
        data: {
          text: 'Reply to post 1',
          postId: post1.id,
          userId: user.id,
        },
      });
      await getTestPrisma().reply.create({
        data: {
          text: 'Reply to post 2',
          postId: post2.id,
          userId: user.id,
        },
      });

      const ctx = await createTestContext();
      const caller = createCaller(ctx);

      const result = await caller.reply.list({ postId: post1.id });

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Reply to post 1');
    });
  });

  describe('add', () => {
    it('should create a new reply when authenticated', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      const ctx = await createTestContext(user.id);
      const caller = createCaller(ctx);

      const result = await caller.reply.add({
        postId: post.id,
        text: 'Test reply',
      });

      expect(result.text).toBe('Test reply');
      expect(result.postId).toBe(post.id);
      expect(result.userId).toBe(user.id);
      expect(result.user.id).toBe(user.id);

      const dbReply = await getTestPrisma().reply.findUnique({
        where: { id: result.id },
      });
      expect(dbReply).toBeDefined();
      expect(dbReply?.text).toBe('Test reply');
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      const ctx = await createTestContext(null);
      const caller = createCaller(ctx);

      await expect(
        caller.reply.add({ postId: post.id, text: 'Test reply' }),
      ).rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('delete', () => {
    it('should delete own reply', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);
      const reply = await getTestPrisma().reply.create({
        data: {
          text: 'Test reply',
          postId: post.id,
          userId: user.id,
        },
      });

      const ctx = await createTestContext(user.id);
      const caller = createCaller(ctx);

      const result = await caller.reply.delete({ id: reply.id });

      expect(result.success).toBe(true);

      const dbReply = await getTestPrisma().reply.findUnique({
        where: { id: reply.id },
      });
      expect(dbReply).toBeNull();
    });

    it('should throw error when deleting another user reply', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const post = await createTestPost(user1.id);
      const reply = await getTestPrisma().reply.create({
        data: {
          text: 'User 1 reply',
          postId: post.id,
          userId: user1.id,
        },
      });

      const ctx = await createTestContext(user2.id);
      const caller = createCaller(ctx);

      await expect(caller.reply.delete({ id: reply.id })).rejects.toThrow(
        'Unauthorized',
      );
    });

    it('should throw error for non-existing reply', async () => {
      const user = await createTestUser();
      const ctx = await createTestContext(user.id);
      const caller = createCaller(ctx);

      await expect(
        caller.reply.delete({ id: 'non-existing-id' }),
      ).rejects.toThrow('Reply not found');
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);
      const reply = await getTestPrisma().reply.create({
        data: {
          text: 'Test reply',
          postId: post.id,
          userId: user.id,
        },
      });

      const ctx = await createTestContext(null);
      const caller = createCaller(ctx);

      await expect(caller.reply.delete({ id: reply.id })).rejects.toThrow(
        'UNAUTHORIZED',
      );
    });
  });
});
