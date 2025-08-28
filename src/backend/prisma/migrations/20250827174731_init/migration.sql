/*
  Warnings:

  - You are about to drop the column `amountCoins` on the `Gift` table. All the data in the column will be lost.
  - You are about to drop the column `creditAccId` on the `Ledger` table. All the data in the column will be lost.
  - You are about to drop the column `debitAccId` on the `Ledger` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Ledger` table. All the data in the column will be lost.
  - Added the required column `coinAmount` to the `Gift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creditAccountId` to the `Ledger` table without a default value. This is not possible if the table is not empty.
  - Added the required column `debitAccountId` to the `Ledger` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Gift" DROP COLUMN "amountCoins",
ADD COLUMN     "coinAmount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Ledger" DROP COLUMN "creditAccId",
DROP COLUMN "debitAccId",
DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creditAccountId" TEXT NOT NULL,
ADD COLUMN     "debitAccountId" TEXT NOT NULL;
