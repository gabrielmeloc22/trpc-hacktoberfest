import { trpc } from '../utils/trpc';
import type { NextPageWithLayout } from './_app';
import type { inferProcedureInput } from '@trpc/server';
import Link from 'next/link';
import { Fragment, useEffect, useRef, useMemo } from 'react';
import type { AppRouter } from '~/server/routers/_app';
import { UserButton, useUser } from '@clerk/nextjs';
import { Sidebar } from '~/components/Sidebar';

const IndexPage: NextPageWithLayout = () => {
  const { user, isSignedIn } = useUser();
  const utils = trpc.useUtils();
  const hasSynced = useRef(false);

  const postsQuery = trpc.post.list.useInfiniteQuery(
    {
      limit: 10,
    },
    {
      getNextPageParam(lastPage) {
        return lastPage.nextCursor;
      },
    },
  );

  const allPostIds = useMemo(() => {
    return (
      postsQuery.data?.pages.flatMap((page) => page.items.map((p) => p.id)) ??
      []
    );
  }, [postsQuery.data]);

  const likeStatusQuery = trpc.like.byPosts.useQuery(
    { postIds: allPostIds },
    { enabled: isSignedIn && allPostIds.length > 0 },
  );

  const addPost = trpc.post.add.useMutation({
    async onSuccess() {
      await utils.post.list.invalidate();
    },
  });

  const toggleLike = trpc.like.toggle.useMutation({
    async onSuccess() {
      await utils.post.list.invalidate();
      await utils.like.byPosts.invalidate();
    },
  });

  const deletePost = trpc.post.delete.useMutation({
    async onMutate({ id }) {
      await utils.post.list.cancel();

      const previousData = utils.post.list.getInfiniteData({ limit: 10 });

      utils.post.list.setInfiniteData({ limit: 10 }, (data) => {
        if (!data) {
          return {
            pages: [],
            pageParams: [],
          };
        }
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.filter((post) => post.id !== id),
          })),
        };
      });

      return { previousData };
    },
    onError(err, variables, context) {
      if (context?.previousData) {
        utils.post.list.setInfiniteData({ limit: 10 }, context.previousData);
      }
    },
    async onSettled() {
      await utils.post.list.invalidate();
    },
  });

  const syncUser = trpc.user.sync.useMutation();

  useEffect(() => {
    if (isSignedIn && !hasSynced.current) {
      hasSynced.current = true;
      syncUser.mutate();
    }
  }, [isSignedIn, syncUser]);

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-gray-700 bg-gray-800 px-4 py-3">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Home</h1>
            <div className="flex items-center gap-4">
              {isSignedIn ? (
                <>
                  <span className="text-sm text-gray-300">
                    {user.username || user.firstName || 'User'}
                  </span>
                  <UserButton />
                </>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/sign-in"
                    className="rounded-full bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="rounded-full border border-gray-500 px-4 py-2 font-semibold text-white hover:bg-gray-700"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-2xl">
          {isSignedIn && (
            <div className="border-b border-gray-700 bg-gray-800 p-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const $form = e.currentTarget;
                  const values = Object.fromEntries(new FormData($form));
                  type Input = inferProcedureInput<AppRouter['post']['add']>;
                  const input: Input = {
                    text: values.text as string,
                  };
                  try {
                    await addPost.mutateAsync(input);
                    $form.reset();
                  } catch (cause) {
                    console.error({ cause }, 'Failed to add post');
                  }
                }}
              >
                <div className="flex flex-col gap-3">
                  <textarea
                    className="resize-none rounded-lg border border-gray-600 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    name="text"
                    placeholder="What's happening?"
                    disabled={addPost.isPending}
                    rows={3}
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      className="rounded-full bg-blue-500 px-6 py-2 font-semibold text-white hover:bg-blue-600 disabled:bg-gray-600"
                      type="submit"
                      disabled={addPost.isPending}
                    >
                      {addPost.isPending ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                  {addPost.error && (
                    <p className="text-sm text-red-500">
                      {addPost.error.message}
                    </p>
                  )}
                </div>
              </form>
            </div>
          )}

          <div className="divide-y divide-gray-700">
            {postsQuery.data?.pages.map((page, index) => (
              <Fragment key={page.items[0]?.id || index}>
                {page.items.map((post) => (
                  <article
                    key={post.id}
                    className="border-b border-gray-700 bg-gray-800 p-4 hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        {post.author?.imageUrl ? (
                          <img
                            src={post.author.imageUrl}
                            alt={post.author.name || 'User'}
                            className="h-12 w-12 rounded-full"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {post.author?.name || 'Unknown'}
                          </span>
                          {post.author?.username && (
                            <span className="text-sm text-gray-400">
                              @{post.author.username}
                            </span>
                          )}
                        </div>
                        <Link href={`/post/${post.id}`}>
                          <p className="mt-1 text-gray-300">{post.text}</p>
                        </Link>
                        <div className="mt-3 flex gap-6 text-sm">
                          <button
                            onClick={() =>
                              isSignedIn &&
                              toggleLike.mutate({ postId: post.id })
                            }
                            disabled={!isSignedIn || toggleLike.isPending}
                            className="flex items-center gap-1 text-gray-400 hover:text-red-500 disabled:cursor-not-allowed"
                          >
                            <span>
                              {likeStatusQuery.data?.[post.id] ? '❤️' : '🤍'}
                            </span>
                            <span>{post._count.likes}</span>
                          </button>
                          <span className="text-gray-400">
                            {post._count.replies}{' '}
                            {post._count.replies === 1 ? 'reply' : 'replies'}
                          </span>
                          {isSignedIn && post.author?.clerkId === user.id && (
                            <button
                              onClick={() => deletePost.mutate({ id: post.id })}
                              disabled={deletePost.isPending}
                              className="ml-auto text-gray-400 hover:text-red-500 disabled:cursor-not-allowed"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </Fragment>
            ))}
          </div>

          {postsQuery.hasNextPage && (
            <div className="p-4">
              <button
                className="w-full rounded-lg bg-gray-700 py-2 font-semibold text-white hover:bg-gray-600 disabled:bg-gray-800"
                onClick={() => postsQuery.fetchNextPage()}
                disabled={postsQuery.isFetchingNextPage}
              >
                {postsQuery.isFetchingNextPage ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}

          {postsQuery.status === 'pending' && (
            <div className="p-8 text-center text-gray-400">
              Loading posts...
            </div>
          )}

          {postsQuery.status === 'error' && (
            <div className="p-8 text-center text-red-500">
              Error loading posts: {postsQuery.error.message}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default IndexPage;
