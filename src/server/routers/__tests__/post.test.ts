import { describe, it, expect } from 'vitest';
import { createCaller } from '../_app';
import { createTestContext } from '../../__tests__/helpers/context';
import {
  createTestUser,
  createTestPost,
  getTestPrisma,
} from '../../__tests__/helpers/db';

describe('postRouter', () => {
  describe('list', () => {
    it('should return empty list when no posts exist', async () => {
      const ctx = await createTestContext();
      const caller = createCaller(ctx);

      const result = await caller.post.list({});

      expect(result.items).toEqual([]);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should return posts ordered by createdAt desc', async () => {
      const user = await createTestUser();
      const post1 = await createTestPost(user.id, 'First post');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const post2 = await createTestPost(user.id, 'Second post');

      const ctx = await createTestContext();
      const caller = createCaller(ctx);

      const result = await caller.post.list({});

      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe(post1.id);
      expect(result.items[1].id).toBe(post2.id);
    });

    it('should support pagination with limit', async () => {
      const user = await createTestUser();
      await createTestPost(user.id, 'Post 1');
      await createTestPost(user.id, 'Post 2');
      await createTestPost(user.id, 'Post 3');

      const ctx = await createTestContext();
      const caller = createCaller(ctx);

      const result = await caller.post.list({ limit: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeDefined();
    });

    it('should support cursor-based pagination', async () => {
      const user = await createTestUser();
      await createTestPost(user.id, 'Post 1');
      await createTestPost(user.id, 'Post 2');
      await createTestPost(user.id, 'Post 3');

      const ctx = await createTestContext();
      const caller = createCaller(ctx);

      const firstPage = await caller.post.list({ limit: 2 });
      const secondPage = await caller.post.list({
        limit: 2,
        cursor: firstPage.nextCursor,
      });

      expect(firstPage.items).toHaveLength(2);
      expect(secondPage.items).toHaveLength(1);
      expect(firstPage.items[0].id).not.toBe(secondPage.items[0].id);
    });
  });

  describe('byId', () => {
    it('should return post by id', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id, 'Test post');

      const ctx = await createTestContext();
      const caller = createCaller(ctx);

      const result = await caller.post.byId({ id: post.id });

      expect(result.id).toBe(post.id);
      expect(result.text).toBe('Test post');
      expect(result.author.id).toBe(user.id);
    });

    it('should throw NOT_FOUND for non-existing post', async () => {
      const ctx = await createTestContext();
      const caller = createCaller(ctx);

      await expect(caller.post.byId({ id: 'non-existing-id' })).rejects.toThrow(
        'No post with id',
      );
    });
  });

  describe('add', () => {
    it('should create a new post when authenticated', async () => {
      const user = await createTestUser();
      const ctx = await createTestContext(user.id);
      const caller = createCaller(ctx);

      const result = await caller.post.add({ text: 'New post' });

      expect(result.text).toBe('New post');
      expect(result.author.id).toBe(user.id);

      const dbPost = await getTestPrisma().post.findUnique({
        where: { id: result.id },
      });
      expect(dbPost).toBeDefined();
      expect(dbPost?.text).toBe('New post');
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = await createTestContext(null);
      const caller = createCaller(ctx);

      await expect(caller.post.add({ text: 'New post' })).rejects.toThrow(
        'UNAUTHORIZED',
      );
    });
  });

  describe('myPosts', () => {
    it('should return only posts from authenticated user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      await createTestPost(user1.id, 'User 1 post');
      await createTestPost(user2.id, 'User 2 post');

      const ctx = await createTestContext(user1.id);
      const caller = createCaller(ctx);

      const result = await caller.post.myPosts({});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].text).toBe('User 1 post');
      expect(result.items[0].author.id).toBe(user1.id);
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const ctx = await createTestContext(null);
      const caller = createCaller(ctx);

      await expect(caller.post.myPosts({})).rejects.toThrow('UNAUTHORIZED');
    });

    it('should support pagination', async () => {
      const user = await createTestUser();
      await createTestPost(user.id, 'Post 1');
      await createTestPost(user.id, 'Post 2');
      await createTestPost(user.id, 'Post 3');

      const ctx = await createTestContext(user.id);
      const caller = createCaller(ctx);

      const result = await caller.post.myPosts({ limit: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete own post', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id, 'Test post');

      const ctx = await createTestContext(user.id);
      const caller = createCaller(ctx);

      const result = await caller.post.delete({ id: post.id });

      expect(result.id).toBe(post.id);

      const dbPost = await getTestPrisma().post.findUnique({
        where: { id: post.id },
      });
      expect(dbPost).toBeNull();
    });

    it('should throw FORBIDDEN when deleting another user post', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const post = await createTestPost(user1.id, 'User 1 post');

      const ctx = await createTestContext(user2.id);
      const caller = createCaller(ctx);

      await expect(caller.post.delete({ id: post.id })).rejects.toThrow(
        'You can only delete your own posts',
      );
    });

    it('should throw NOT_FOUND for non-existing post', async () => {
      const user = await createTestUser();
      const ctx = await createTestContext(user.id);
      const caller = createCaller(ctx);

      await expect(
        caller.post.delete({ id: 'non-existing-id' }),
      ).rejects.toThrow('No post with id');
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id, 'Test post');

      const ctx = await createTestContext(null);
      const caller = createCaller(ctx);

      await expect(caller.post.delete({ id: post.id })).rejects.toThrow(
        'UNAUTHORIZED',
      );
    });
  });
});
