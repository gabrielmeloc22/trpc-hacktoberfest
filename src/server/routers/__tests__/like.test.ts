import { describe, it, expect } from 'vitest';
import { createCaller } from '../_app';
import { createTestContext } from '../../__tests__/helpers/context';
import {
  createTestUser,
  createTestPost,
  getTestPrisma,
} from '../../__tests__/helpers/db';

describe('likeRouter', () => {
  describe('toggle', () => {
    it('should like a post when not already liked', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      const ctx = await createTestContext(user.id);
      const caller = createCaller(ctx);

      const result = await caller.like.toggle({ postId: post.id });

      expect(result.liked).toBe(true);

      const dbLike = await getTestPrisma().like.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: post.id,
          },
        },
      });
      expect(dbLike).toBeDefined();
    });

    it('should unlike a post when already liked', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      await getTestPrisma().like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });

      const ctx = await createTestContext(user.id);
      const caller = createCaller(ctx);

      const result = await caller.like.toggle({ postId: post.id });

      expect(result.liked).toBe(false);

      const dbLike = await getTestPrisma().like.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: post.id,
          },
        },
      });
      expect(dbLike).toBeNull();
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      const ctx = await createTestContext(null);
      const caller = createCaller(ctx);

      await expect(caller.like.toggle({ postId: post.id })).rejects.toThrow(
        'UNAUTHORIZED',
      );
    });
  });

  describe('byPost', () => {
    it('should return liked=true for liked post', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      await getTestPrisma().like.create({
        data: {
          userId: user.id,
          postId: post.id,
        },
      });

      const ctx = await createTestContext(user.id);
      const caller = createCaller(ctx);

      const result = await caller.like.byPost({ postId: post.id });

      expect(result.liked).toBe(true);
    });

    it('should return liked=false for not liked post', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      const ctx = await createTestContext(user.id);
      const caller = createCaller(ctx);

      const result = await caller.like.byPost({ postId: post.id });

      expect(result.liked).toBe(false);
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      const ctx = await createTestContext(null);
      const caller = createCaller(ctx);

      await expect(caller.like.byPost({ postId: post.id })).rejects.toThrow(
        'UNAUTHORIZED',
      );
    });
  });

  describe('byPosts', () => {
    it('should return liked status for multiple posts', async () => {
      const user = await createTestUser();
      const post1 = await createTestPost(user.id, 'Post 1');
      const post2 = await createTestPost(user.id, 'Post 2');
      const post3 = await createTestPost(user.id, 'Post 3');

      await getTestPrisma().like.create({
        data: {
          userId: user.id,
          postId: post1.id,
        },
      });
      await getTestPrisma().like.create({
        data: {
          userId: user.id,
          postId: post3.id,
        },
      });

      const ctx = await createTestContext(user.id);
      const caller = createCaller(ctx);

      const result = await caller.like.byPosts({
        postIds: [post1.id, post2.id, post3.id],
      });

      expect(result[post1.id]).toBe(true);
      expect(result[post2.id]).toBeUndefined();
      expect(result[post3.id]).toBe(true);
    });

    it('should return empty object when not authenticated', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      const ctx = await createTestContext(null);
      const caller = createCaller(ctx);

      const result = await caller.like.byPosts({ postIds: [post.id] });

      expect(result).toEqual({});
    });

    it('should return empty object for empty postIds array', async () => {
      const user = await createTestUser();
      const ctx = await createTestContext(user.id);
      const caller = createCaller(ctx);

      const result = await caller.like.byPosts({ postIds: [] });

      expect(result).toEqual({});
    });
  });
});
