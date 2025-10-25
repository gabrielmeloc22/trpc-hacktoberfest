import { trpc } from '../utils/trpc';
import type { NextPageWithLayout } from './_app';
import Link from 'next/link';
import { Fragment } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import { Sidebar } from '~/components/Sidebar';

const ProfilePage: NextPageWithLayout = () => {
  const { user, isSignedIn } = useUser();
  const utils = trpc.useUtils();

  const postsQuery = trpc.post.myPosts.useInfiniteQuery(
    {
      limit: 10,
    },
    {
      getNextPageParam(lastPage) {
        return lastPage.nextCursor;
      },
    },
  );

  // Implemente a lógica da mutation
  // const toggleLike = trpc.like.toggle.useMutation()

  const deletePost = trpc.post.delete.useMutation({
    async onMutate({ id }) {
      await utils.post.myPosts.cancel();

      const previousData = utils.post.myPosts.getInfiniteData({ limit: 10 });

      utils.post.myPosts.setInfiniteData({ limit: 10 }, (data) => {
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
        utils.post.myPosts.setInfiniteData({ limit: 10 }, context.previousData);
      }
    },
    async onSettled() {
      await utils.post.myPosts.invalidate();
    },
  });

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center bg-gray-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">
              Sign in to view your profile
            </h1>
            <Link
              href="/sign-in"
              className="mt-4 inline-block rounded-full bg-blue-500 px-6 py-3 font-semibold text-white hover:bg-blue-600"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-gray-700 bg-gray-800 px-4 py-3">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                {user.username || user.firstName || 'User'}
              </span>
              <UserButton />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-2xl">
          <div className="border-b border-gray-700 bg-gray-800 p-6">
            <div className="flex items-center gap-4">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.firstName || 'User'}
                  className="h-20 w-20 rounded-full"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-600" />
              )}
              <div>
                <h2 className="text-xl font-bold text-white">
                  {user.firstName} {user.lastName}
                </h2>
                {user.username && (
                  <p className="text-gray-400">@{user.username}</p>
                )}
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-700">
            {postsQuery.data?.pages.map((page, index) => (
              <Fragment key={page.items[0]?.id || index}>
                {page.items.map((post) => (
                  <article
                    key={post.id}
                    className="border-b border-gray-700 bg-gray-800 p-4 transition-colors hover:bg-gray-750"
                  >
                    <Link href={`/post/${post.id}`}>
                      <p className="text-gray-300">{post.text}</p>
                    </Link>
                    <div className="mt-3 flex gap-6 text-sm">
                      <button
                        onClick={() =>
                          // Chame a mutation aqui passando o postId
                        }
                        className="flex items-center gap-1 text-gray-400 hover:text-red-500 disabled:cursor-not-allowed"
                      >
                        <span>🤍</span>
                        <span>{post._count.likes}</span>
                      </button>
                      <span className="text-gray-400">
                        {post._count.replies}{' '}
                        {post._count.replies === 1 ? 'reply' : 'replies'}
                      </span>
                      <button
                        onClick={() => deletePost.mutate({ id: post.id })}
                        disabled={deletePost.isPending}
                        className="ml-auto text-gray-400 hover:text-red-500 disabled:cursor-not-allowed"
                      >
                        🗑️ Delete
                      </button>
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
              Loading your posts...
            </div>
          )}

          {postsQuery.status === 'success' &&
            postsQuery.data.pages[0]?.items.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                You haven't posted anything yet.
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

export default ProfilePage;
