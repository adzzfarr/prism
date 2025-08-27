-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "tiktokId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "kycStatus" TEXT NOT NULL DEFAULT 'none',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Live" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "metricsJson" JSONB,
    "qualityScore" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'running',

    CONSTRAINT "Live_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Gift" (
    "id" TEXT NOT NULL,
    "liveId" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "amountCoins" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "riskFlag" BOOLEAN NOT NULL DEFAULT false,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Ledger" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "debitAccId" TEXT NOT NULL,
    "creditAccId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'COIN',
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "hashPrev" TEXT,
    "hashThis" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unsettled',

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payout" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "externalRef" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MerkleSnapshot" (
    "id" TEXT NOT NULL,
    "root" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "ledgerIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerkleSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_tiktokId_key" ON "public"."User"("tiktokId");

-- CreateIndex
CREATE UNIQUE INDEX "Gift_idempotencyKey_key" ON "public"."Gift"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "public"."Live" ADD CONSTRAINT "Live_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Gift" ADD CONSTRAINT "Gift_liveId_fkey" FOREIGN KEY ("liveId") REFERENCES "public"."Live"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Gift" ADD CONSTRAINT "Gift_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
