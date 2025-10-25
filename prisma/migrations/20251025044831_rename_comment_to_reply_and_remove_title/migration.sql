-- AlterTable: Remove title column from Post
ALTER TABLE "Post" DROP COLUMN IF EXISTS "title";

-- RenameTable: Rename Comment to Reply
ALTER TABLE "Comment" RENAME TO "Reply";
