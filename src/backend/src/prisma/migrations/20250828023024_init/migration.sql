-- DropForeignKey
ALTER TABLE "public"."Account" DROP CONSTRAINT "Account_ownerId_fkey";

-- AlterTable
ALTER TABLE "public"."Account" ALTER COLUMN "ownerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
