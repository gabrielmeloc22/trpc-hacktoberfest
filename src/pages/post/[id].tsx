import NextError from 'next/error';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

import type { NextPageWithLayout } from '~/pages/_app';
import type { RouterOutput } from '~/utils/trpc';
import { trpc } from '~/utils/trpc';

type PostByIdOutput = RouterOutput['post']['byId'];

function PostItem(props: { post: PostByIdOutput }) {
  const { post } = props;
  const { isSignedIn } = useUser();
  const utils = trpc.useUtils();
  const [replyText, setReplyText] = useState('');

  const repliesQuery = trpc.reply.list.useQuery({ postId: post.id });
  const likeStatusQuery = trpc.like.byPost.useQuery(
    { postId: post.id },
    { enabled: isSignedIn },
  );

  const toggleLike = trpc.like.toggle.useMutation({
    async onSuccess() {
      await utils.like.byPost.invalidate();
      await utils.post.byId.invalidate();
    },
  });

  const addReply = trpc.reply.add.useMutation({
    async onSuccess() {
      await utils.reply.list.invalidate();
      await utils.post.byId.invalidate();
      setReplyText('');
    },
  });

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-700 bg-gray-800 px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <Link className="text-blue-400 hover:underline" href="/">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-4">
        <article className="rounded-lg border border-gray-700 bg-gray-800 p-6">
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
              <p className="text-sm text-gray-400">
                {post.createdAt.toLocaleDateString('en-us', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="mt-3 text-lg text-gray-300">{post.text}</p>
          </div>

          <div className="mt-6 flex gap-6 border-t border-gray-700 pt-4">
            <button
              onClick={() =>
                isSignedIn && toggleLike.mutate({ postId: post.id })
              }
              disabled={!isSignedIn || toggleLike.isPending}
              className="flex items-center gap-2 text-gray-400 hover:text-red-500 disabled:cursor-not-allowed"
            >
              <span className="text-xl">
                {likeStatusQuery.data?.liked ? '❤️' : '🤍'}
              </span>
              <span>{post._count.likes}</span>
            </button>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-xl">💬</span>
              <span>{post._count.replies}</span>
            </div>
          </div>
        </article>

        <div className="mt-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Replies</h2>

          {isSignedIn && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (replyText.trim()) {
                  addReply.mutate({ postId: post.id, text: replyText });
                }
              }}
              className="mb-6 rounded-lg border border-gray-700 bg-gray-800 p-4"
            >
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full resize-none rounded-lg border border-gray-600 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                placeholder="Write a reply..."
                rows={3}
                disabled={addReply.isPending}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!replyText.trim() || addReply.isPending}
                  className="rounded-full bg-blue-500 px-6 py-2 font-semibold text-white hover:bg-blue-600 disabled:bg-gray-600"
                >
                  {addReply.isPending ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {repliesQuery.data?.map((reply) => (
              <div
                key={reply.id}
                className="rounded-lg border border-gray-700 bg-gray-800 p-4"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    {reply.user?.imageUrl ? (
                      <img
                        src={reply.user.imageUrl}
                        alt={reply.user.name || 'User'}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {reply.user?.name || 'Unknown'}
                      </span>
                      {reply.user?.username && (
                        <span className="text-sm text-gray-400">
                          @{reply.user.username}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">·</span>
                      <span className="text-sm text-gray-500">
                        {reply.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-300">{reply.text}</p>
                  </div>
                </div>
              </div>
            ))}

            {repliesQuery.status === 'pending' && (
              <div className="text-center text-gray-400">
                Loading replies...
              </div>
            )}

            {repliesQuery.data?.length === 0 && (
              <div className="text-center text-gray-500">
                No replies yet. Be the first to reply!
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const PostViewPage: NextPageWithLayout = () => {
  const id = useRouter().query.id as string;
  const postQuery = trpc.post.byId.useQuery({ id });

  if (postQuery.error) {
    return (
      <NextError
        title={postQuery.error.message}
        statusCode={postQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (postQuery.status !== 'success') {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 h-10 w-full animate-pulse rounded-md bg-zinc-900/70"></div>
          <div className="mb-8 h-5 w-2/6 animate-pulse rounded-md bg-zinc-900/70"></div>
          <div className="h-40 w-full animate-pulse rounded-md bg-zinc-900/70"></div>
        </div>
      </div>
    );
  }

  const { data } = postQuery;
  return <PostItem post={data} />;
};

export default PostViewPage;
