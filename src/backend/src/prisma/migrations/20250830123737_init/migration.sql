/*
  Warnings:

  - You are about to drop the column `balance` on the `Account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Account" DROP COLUMN "balance",
ADD COLUMN     "balanceUSD" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
