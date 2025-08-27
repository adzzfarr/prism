/*
  Warnings:

  - You are about to drop the column `coinAmount` on the `Gift` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Ledger` table. All the data in the column will be lost.
  - You are about to drop the column `creditAccountId` on the `Ledger` table. All the data in the column will be lost.
  - You are about to drop the column `debitAccountId` on the `Ledger` table. All the data in the column will be lost.
  - Added the required column `amountCoins` to the `Gift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creditAccId` to the `Ledger` table without a default value. This is not possible if the table is not empty.
  - Added the required column `debitAccId` to the `Ledger` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Gift" DROP COLUMN "coinAmount",
ADD COLUMN     "amountCoins" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Ledger" DROP COLUMN "createdAt",
DROP COLUMN "creditAccountId",
DROP COLUMN "debitAccountId",
ADD COLUMN     "creditAccId" TEXT NOT NULL,
ADD COLUMN     "debitAccId" TEXT NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
