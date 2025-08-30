// How to run: 
// pnpm tsx demo/demo-data.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.gift.deleteMany({});
  await prisma.live.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.ledger.deleteMany({});
  await prisma.merkleSnapshot.deleteMany({});

  // Create users
  const creator = await prisma.user.create({
    data: { name: 'Alice Creator', id: 'demo-creator', role: 'creator', kycStatus: 'verified' }
  });
  const consumer1 = await prisma.user.create({
    data: { name: 'Bob Fan', role: 'consumer', kycStatus: 'verified' }
  });
  const consumer2 = await prisma.user.create({
    data: { name: 'Charlie Fan', role: 'consumer', kycStatus: 'unverified' }
  });
  const consumer3 = await prisma.user.create({
    data: { name: 'Dana Fan', role: 'consumer', kycStatus: 'verified' }
  });

  // Create accounts
  const creatorAccount = await prisma.account.create({
    data: { ownerId: creator.id, type: 'creator', balance: 0 }
  });
  const holdingAccount = await prisma.account.create({
    data: { ownerId: creator.id, type: 'holding', balance: 0 }
  });
  const platformAccount = await prisma.account.create({
    data: { type: 'platform', balance: 0 }
  });
  const reserveAccount = await prisma.account.create({
    data: { type: 'reserve', balance: 0 }
  });
  const consumerAccount1 = await prisma.account.create({
    data: { ownerId: consumer1.id, type: 'consumer', balance: 5000 }
  });
  const consumerAccount2 = await prisma.account.create({
    data: { ownerId: consumer2.id, type: 'consumer', balance: 5000 }
  });
  const consumerAccount3 = await prisma.account.create({
    data: { ownerId: consumer3.id, type: 'consumer', balance: 5000 }
  });

  // Create live sessions
  const liveRunning = await prisma.live.create({
    data: {
      creatorId: creator.id,
      startAt: new Date(Date.now() - 30 * 60 * 1000), // started 30 min ago
      status: 'running'
    }
  });
  const liveEnded = await prisma.live.create({
    data: {
      creatorId: creator.id,
      startAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // started 2 hours ago
      endAt: new Date(Date.now() - 60 * 60 * 1000), // ended 1 hour ago
      status: 'ended'
    }
  });

  // Create gifts (various scenarios)
  await prisma.gift.create({
    data: {
      idempotencyKey: 'gift-1',
      liveId: liveRunning.id,
      consumerId: consumer1.id,
      coinAmount: 100,
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      riskFlag: false
    }
  });
  await prisma.gift.create({
    data: {
      idempotencyKey: 'gift-2',
      liveId: liveRunning.id,
      consumerId: consumer2.id,
      coinAmount: 2000, // Large amount, triggers risk
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
      riskFlag: true
    }
  });
  await prisma.gift.create({
    data: {
      idempotencyKey: 'gift-3',
      liveId: liveRunning.id,
      consumerId: consumer3.id,
      coinAmount: 50,
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      riskFlag: false
    }
  });
  await prisma.gift.create({
    data: {
      idempotencyKey: 'gift-4',
      liveId: liveEnded.id,
      consumerId: consumer1.id,
      coinAmount: 500,
      timestamp: new Date(Date.now() - 90 * 60 * 1000),
      riskFlag: false
    }
  });
  await prisma.gift.create({
    data: {
      idempotencyKey: 'gift-5',
      liveId: liveEnded.id,
      consumerId: consumer2.id,
      coinAmount: 1000,
      timestamp: new Date(Date.now() - 80 * 60 * 1000),
      riskFlag: true // Unverified user
    }
  });

  // Simulate ledger entries for gifts
  await prisma.ledger.create({
    data: {
      debitAccountId: consumerAccount1.id,
      creditAccountId: holdingAccount.id,
      amount: 100,
      refType: 'gift',
      refId: 'gift-1',
      hashPrev: '',
      hashThis: 'hash-1',
      status: 'settled'
    }
  });
  await prisma.ledger.create({
    data: {
      debitAccountId: consumerAccount2.id,
      creditAccountId: holdingAccount.id,
      amount: 2000,
      refType: 'gift',
      refId: 'gift-2',
      hashPrev: 'hash-1',
      hashThis: 'hash-2',
      status: 'settled'
    }
  });
  await prisma.ledger.create({
    data: {
      debitAccountId: consumerAccount3.id,
      creditAccountId: holdingAccount.id,
      amount: 50,
      refType: 'gift',
      refId: 'gift-3',
      hashPrev: 'hash-2',
      hashThis: 'hash-3',
      status: 'settled'
    }
  });

  // Simulate settlement for ended live
  await prisma.ledger.create({
    data: {
      debitAccountId: holdingAccount.id,
      creditAccountId: creatorAccount.id,
      amount: 800,
      refType: 'settlement',
      refId: liveEnded.id,
      hashPrev: 'hash-3',
      hashThis: 'hash-4',
      status: 'settled'
    }
  });
  await prisma.ledger.create({
    data: {
      debitAccountId: holdingAccount.id,
      creditAccountId: platformAccount.id,
      amount: 500,
      refType: 'settlement',
      refId: liveEnded.id,
      hashPrev: 'hash-4',
      hashThis: 'hash-5',
      status: 'settled'
    }
  });
  await prisma.ledger.create({
    data: {
      debitAccountId: holdingAccount.id,
      creditAccountId: reserveAccount.id,
      amount: 200,
      refType: 'settlement',
      refId: liveEnded.id,
      hashPrev: 'hash-5',
      hashThis: 'hash-6',
      status: 'settled'
    }
  });

  // Create a Merkle snapshot for proof
  await prisma.merkleSnapshot.create({
    data: {
      root: 'demo-merkle-root',
      signature: 'demo-signature',
      ledgerIds: [
        // Add all ledger IDs created above
        // You can fetch them dynamically if needed
      ]
    }
  });

  console.log('Demo data created! Open your frontend to see all features.');
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });