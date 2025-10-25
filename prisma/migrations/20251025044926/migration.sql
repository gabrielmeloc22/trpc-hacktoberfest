-- AlterTable
ALTER TABLE "Reply" RENAME CONSTRAINT "Comment_pkey" TO "Reply_pkey";

-- RenameForeignKey
ALTER TABLE "Reply" RENAME CONSTRAINT "Comment_postId_fkey" TO "Reply_postId_fkey";

-- RenameForeignKey
ALTER TABLE "Reply" RENAME CONSTRAINT "Comment_userId_fkey" TO "Reply_userId_fkey";
