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

  // Create demo creator (used for Home page live creation)
  const demoCreator = await prisma.user.create({
    data: { name: 'Demo Creator', id: 'demo-creator', role: 'creator', kycStatus: 'verified' }
  });

  await prisma.account.create({ data: { owner: { connect: { id: demoCreator.id } }, type: 'creator', balanceUSD: 0 } });
  await prisma.account.create({ data: { owner: { connect: { id: demoCreator.id } }, type: 'holding', balanceUSD: 0 } });

  // Create a few fan users for demo gift sending
  const consumer1 = await prisma.user.create({
    data: { name: 'Bob Fan', role: 'consumer', kycStatus: 'verified' }
  });
  const consumer2 = await prisma.user.create({
    data: { name: 'Charlie Fan', role: 'consumer', kycStatus: 'unverified' }
  });
  const consumer3 = await prisma.user.create({
    data: { name: 'Dana Fan', role: 'consumer', kycStatus: 'verified' }
  });

  await prisma.account.create({ data: { owner: { connect: { id: consumer1.id } }, type: 'consumer', balanceUSD: 50000 } });
  await prisma.account.create({ data: { owner: { connect: { id: consumer2.id } }, type: 'consumer', balanceUSD: 50000 } });
  await prisma.account.create({ data: { owner: { connect: { id: consumer3.id } }, type: 'consumer', balanceUSD: 50000 } });

  // Shared platform and reserve accounts
  await prisma.account.create({ data: { type: 'reserve', balanceUSD: 0 } });
  await prisma.account.create({ data: { type: 'platform', balanceUSD: 0 } });

  // Merkle snapshot for proof
  await prisma.merkleSnapshot.create({
    data: {
      root: 'demo-merkle-root',
      signature: 'demo-signature',
      ledgerIds: []
    }
  });

  console.log('Demo data created! You can now use the frontend and demo gift buttons.');
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });