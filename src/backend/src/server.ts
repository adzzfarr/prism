import { PrismaClient } from "@prisma/client";
import express from 'express';
import { Request, Response } from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import process from "process";

const prisma = new PrismaClient();
const app = express();
app.use(bodyParser.json());

// Config
const HMAC_SECRET = process.env.HMAC_SECRET || 'demo-secret';

/* POST REQUESTS */

// Create user
app.post('/users', async (req: Request, res: Response) => {
    const { tiktokId, name, role, kycStatus } = req.body;
    try {
        const user = await prisma.user.create({
            data: {tiktokId, name, role, kycStatus}
        });
        res.status(201).send(user);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to create user." });
    }
});

// Create live session
app.post('/lives', async (req: Request, res: Response) => {
    const { creatorId, startAt } = req.body;
    try {
        const live = await prisma.live.create({
            data: {creatorId, startAt: new Date(startAt)}
        });
        res.status(201).send(live);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to create live session." });
    }
});

// Create account
app.post('/accounts', async (req: Request, res: Response) => {
    const { ownerId, type, balance } = req.body;
    try {
        const data: any = { type, balance: balance ?? 0 };
        if (ownerId) data.ownerId = ownerId; // Only set ownerId if present
        const account = await prisma.account.create({ data });
        res.status(201).send(account);
    } catch (error) {
        console.error('Account creation error:', error, req.body);
        res.status(500).send({ error: "Failed to create account." });
    }
});

// Idempotent Gift handler
app.post('/webhooks/gift', async (req: Request, res: Response) => {
    const signature = req.headers['x-hmac-signature'] as string | undefined;
    const raw = JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', HMAC_SECRET).update(raw).digest('hex');

    if (signature !== expected) return res.status(401).send({error: 'Invalid Signature'});

    const {
        idempotencyKey, 
        liveId, 
        consumerId, 
        coinAmount, 
    } = req.body;

    // Check if gift already processed
    const existing = await prisma.gift.findUnique({where: {idempotencyKey}});
    if (existing) return res.status(200).send({status: 'already-recorded'});

    // Otherwise, create gift
    // Fetch consumer data to perform fraud risk assessment
    const consumer = await prisma.user.findUnique({where: {id: consumerId}});
    if (!consumer) return res.status(404).send({error: 'Consumer not found'});

    // Count recent gifts (e.g. in the last hour; can be adjusted)
    const recentGiftsCount = await prisma.gift.count({
        where: {
            consumerId,
            timestamp: {
                gte: new Date(Date.now() - 60 * 60 * 1000), 
            },
        },
    });

    // Assess risk of fraud
    const riskFlag = assessGiftRisk({
        coinAmount,
        consumer: {
            createdAt: consumer.createdAt, 
            kycStatus: consumer.kycStatus
        },
        recentGiftCount: recentGiftsCount,
    });

    // Record the gift
    const gift = await prisma.gift.create({
        data: {
            idempotencyKey,
            liveId,
            consumerId,
            coinAmount,
            timestamp: new Date(),
            riskFlag,
        }
    });

    const holdingAccount = await getHoldingAccountforCreatorByLive(liveId);

    // Ledger double-entry 
    // Debit: From consumer account 
    // Credit: To holding account 
    await createLedgerEntry({
        debitAccountId: 'consumer-'+consumerId, 
        creditAccountId: holdingAccount.id, 
        amount: coinAmount, 
        refType: 'gift', 
        refId: gift.id,
    });

    return res.send({status: 'ok', gift});
});

// End live and settle
app.post('/lives/:id/end', async (req: Request, res: Response) => {
    const liveId = req.params.id;
    await prisma.live.update({where: {id: liveId}, data: {endAt: new Date(), status: 'ended'}});

    // Compute quality of live
    const qualityMetrics = await computeQualityScore(liveId);
    await prisma.live.update({where: {id: liveId}, data: {qualityScore: qualityMetrics.score}});

    // Settle the live
    const settlement = await runSettlementForLive(liveId, qualityMetrics.score);

    // Create Merkle snapshot
    await createMerkleSnapshot();

    res.send({status: 'settled', settlement, qualityMetrics});
});

/* GET REQUESTS */

// Get all live sessions
app.get('/lives', async (req: Request, res: Response) => {
    try {
        const lives = await prisma.live.findMany({
            include: { creator: true },
            orderBy: { startAt: 'desc' },
        });
        res.send(lives);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch live sessions." });
    }
});

// Get specific live session
app.get('/lives/:id', async (req, res) => {
  try {
    const live = await prisma.live.findUnique({
      where: { id: req.params.id },
      include: {
        creator: true,
        gifts: {
          include: {
            consumer: true
          }
        }
      },
    });
    if (!live) return res.status(404).send({ error: "Session not found" });

    // Compute fraud statistics
    const fraudStats = computeFraudStatistics(live.gifts);

    // Compute quality metrics
    const qualityMetrics = await computeQualityScore(live.id);

    res.send({
        ...live,
        fraudStats,
        qualityMetrics,
    });
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch session." });
  }
});

// Get creator balance
app.get('/creators/:id/balance', async (req: Request, res: Response) => {
    const creatorId = req.params.id;
    const account = await prisma.account.findFirst({where: {ownerId: creatorId, type: 'creator'}});
    res.send({balance: account?.balance ?? 0});
});

// Provide Merkle proof for a given ledger entry
app.get('/merkle/proof/:ledgerId', async (req: Request, res: Response) => {
     const {ledgerId} = req.params;

    const ledgerEntry = await prisma.ledger.findUnique({
        where: {id: ledgerId}
    });
    if (!ledgerEntry) return res.status(404).send({error: 'Ledger entry not found'});

    const snapshot = await prisma.merkleSnapshot.findFirst({
        where: {ledgerIds: {has: ledgerId}},
        orderBy: {createdAt: 'desc'}, // most recent snapshot
    });
    if (!snapshot) return res.status(404).send({error: 'No Merkle snapshot found'});

    // Fetch all original items from snapshot
    const settledLedger = await prisma.ledger.findMany({
        where: {id: {in: snapshot.ledgerIds}},
        orderBy: {createdAt: 'asc'}, // same order as when snapshot was created
    });

    const itemsToHash = settledLedger.map(entry => JSON.stringify({
        id: entry.id,
        debitAccountId: entry.debitAccountId,
        creditAccountId: entry.creditAccountId,
        amount: entry.amount,
        refType: entry.refType,
        refId: entry.refId,
    }));

    // Find initial hash and index of the requested ledger entry
    let currentIndex = settledLedger.findIndex(entry => entry.id === ledgerId);
    if (currentIndex === -1) {
        return res.status(404).send({error: 'Ledger entry not found in the snapshot'});
    }

    const proofHashes: string[] = [];
    let currentLevel = itemsToHash.map(item => crypto.createHash('sha256').update(item).digest('hex'));

    while (currentLevel.length > 1) {
        const nextLevel: string[] = [];
        const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;

        // Add the sibling to the proof path, if it exists
        if (siblingIndex < currentLevel.length) {
            proofHashes.push(currentLevel[siblingIndex]);
        } else {
            // Handle the odd number of nodes case where there is no sibling
            proofHashes.push(currentLevel[currentIndex]);
        }

        // Build the next level of the tree
        for (let i = 0; i < currentLevel.length; i += 2) {
            if (i + 1 === currentLevel.length) {
                nextLevel.push(currentLevel[i]);
            } else {
                nextLevel.push(crypto.createHash('sha256').update(currentLevel[i] + currentLevel[i + 1]).digest('hex'));
            }
        }
        currentLevel = nextLevel;
        currentIndex = Math.floor(currentIndex / 2);
    }
    
    // Reverse proof hashes to get correct order for verification
    proofHashes.reverse();

    return res.status(200).send({
        ledgerEntry,
        merkleRoot: snapshot.root,
        rootSignature: snapshot.signature,
        proof: proofHashes,
    });
});

app.listen(4000, () => console.log('Listening on 4000'));

async function getHoldingAccountforCreatorByLive(liveId: string) {
    const live = await prisma.live.findUnique({
        where: {id: liveId}
    });
    if (!live) throw new Error('Live not found');

    const creatorId = live!.creatorId;
    const account = await prisma.account.findFirst({
        where: {ownerId: creatorId, type: 'holding'}
    });
    if (account) return account;

    // If holding account does not exist yet, create one
    return prisma.account.create({
        data: {ownerId: creatorId, type: 'holding'}
    });
}

async function createLedgerEntry({
    debitAccountId, 
    creditAccountId, 
    amount, 
    refType, 
    refId
} : {
    debitAccountId: string, 
    creditAccountId: string, 
    amount: number, 
    refType: string, 
    refId: string
}) {
    // Money flows out from debit account to the credit account

    // Use transaction API to avoid race condition (between ledger record creation and account updating); maintain data integrity 
    await prisma.$transaction(async (transaction) => {
        // Compute previous hash based on most recent ledger entry
        const prev = await transaction.ledger.findFirst({orderBy: {createdAt: 'desc'}}); 
        const prevHash = prev?.hashThis ?? '';

        // Update previous hash
        const payload = `${debitAccountId}|${creditAccountId}|${amount}|${refType}|${refId}|${Date.now()}`;
        const hash = crypto.createHash('sha256').update(prevHash + payload).digest('hex');

        await transaction.ledger.create({
            data: {
                debitAccountId, 
                creditAccountId, 
                amount, 
                refType, 
                refId, 
                hashPrev: 
                prevHash, 
                hashThis: hash,
                status: 'settled', // For simplicity, mark as settled immediately; in real world, may have pending state
            }
        });

        // Update account balances
        const debit = await transaction.account.findUnique({where: {id: debitAccountId}});
        const credit = await transaction.account.findUnique({where: {id: creditAccountId}});

        if (debit) await transaction.account.update({
            where: {id: debit.id}, 
            data: {balance: debit.balance - amount}
        });

        if (credit) await transaction.account.update({
            where: {id: credit.id}, 
            data: {balance: credit.balance + amount}
        });
    });
}

async function computeQualityScore(liveId: string) {
    // Use gift counts to calculate user retention and user engagement
    const gifts = await prisma.gift.findMany({where: {liveId}});
    const giftCount = gifts.length;

    // Fake values for retention and engagement; could be calculated using
    // average watch time / live duration, number of comments per minute, etc.
    // Weights can be adjusted after real world testing
    const retention = Math.min(1, 0.3 + giftCount * 0.05);
    const engagement = Math.min(1, 0.15 + giftCount * 0.025);

    // Calculate quality score
    // Weights can be adjusted after real world testing
    const score = Math.round((retention * 0.5 + engagement * 0.5) * 100);
    return { score, retention, engagement };
}

async function runSettlementForLive(liveId: string, quality: number) {
    // Convert gifts to coins
    const gifts = await prisma.gift.findMany({where: {liveId}});
    const total = gifts.reduce((prev, gift) => prev + gift.coinAmount, 0);

    // Base proportions of shares
    const baseCreatorShare = 0.65;
    const basePlatformShare = 0.3;
    // reserveShare = 0.05; can be adjusted

    // Adjust creator and platform shares based on quality; formula can be adjusted as necessary
    const qualityBonus = Math.min(0.15, Math.max(0, (quality - 40) / 200));
    const creatorShare = baseCreatorShare + qualityBonus;
    const platformShare = basePlatformShare - qualityBonus;

    const creatorAmount = Math.floor(total * creatorShare);
    const platformAmount = Math.floor(total * platformShare);
    const reserveAmount = total - creatorAmount - platformAmount;

    // Ledger: Move from holding account to creator, platform, and reserve accounts
    const holding = await getHoldingAccountforCreatorByLive(liveId);
    const live = await prisma.live.findUnique({where: {id: liveId}});

    const creatorAccount = await prisma.account.findFirst({
        where: {ownerId: live!.creatorId, type: 'creator'}
    });

    const platformAccount = await prisma.account.findFirst({
        where: {type: 'platform'}
    });

    const reserveAccount = await prisma.account.findFirst({
        where: {type: 'reserve'}
    });

    await createLedgerEntry({
        debitAccountId: holding.id, 
        creditAccountId: creatorAccount!.id, 
        amount: creatorAmount, 
        refType: 'settlement', 
        refId: liveId,
    });
    
    await createLedgerEntry({
        debitAccountId: holding.id, 
        creditAccountId: platformAccount!.id, 
        amount: platformAmount, 
        refType: 'settlement', 
        refId: liveId,
    });

    await createLedgerEntry({
        debitAccountId: holding.id, 
        creditAccountId: reserveAccount!.id, 
        amount: reserveAmount, 
        refType: 'settlement', 
        refId: liveId
    });

    return {
        total, 
        creatorAmount, 
        platformAmount, 
        reserveAmount,
    };
}

async function createMerkleSnapshot() {
    // Fetch all settled ledger entries, with earliest entry first for consistent Merkle tree
    const settledLedger = await prisma.ledger.findMany({
        where: {status: 'settled'},
        orderBy: {createdAt: 'asc'},
    });

    if (settledLedger.length === 0) {
        // No settled ledger entries to snapshot
        return;
    }

    // Prepare data for hashing => every node in the Merkle tree should be a unique string representation of a ledger entry
    const itemsToHash = settledLedger.map(entry => JSON.stringify({
        id: entry.id,
        debitAccountId: entry.debitAccountId,
        creditAccountId: entry.creditAccountId,
        amount: entry.amount,
        refType: entry.refType,
        refId: entry.refId,
    }));

    // Construct the Merkle root
    const merkleRoot = buildMerkleRoot(itemsToHash);

    // Sign the Merkle root
    const signature = crypto.createHmac('sha256', HMAC_SECRET).update(merkleRoot).digest('hex');

    // Store the snapshot
    await prisma.merkleSnapshot.create({
        data: {
            root: merkleRoot,
            signature: signature,
            ledgerIds: settledLedger.map(entry => entry.id), // for proof generation later on
        }
    });
}

/* Helper Functions */

function assessGiftRisk({
    coinAmount,
    consumer,
    recentGiftCount,
} : {
    coinAmount: number;
    consumer: { createdAt: Date; kycStatus: string };
    recentGiftCount: number;
}) : boolean {
    if ((coinAmount > 1000) || (recentGiftCount > 10) || (consumer.kycStatus !== "verified")) return true;
    return false;
}

function computeFraudStatistics(gifts: any[]) {
  const total = gifts.length;
  const frauds = gifts.filter(g => g.riskFlag);
  const fraudCount = frauds.length;
  const fraudUsers = new Set(frauds.map(g => g.consumer?.name)).size;

  return {
    totalGifts: total,
    fraudCount,
    fraudUsers,
    fraudPercent: total > 0 ? Math.round((fraudCount / total) * 100) : 0
  };
}


function buildMerkleRoot(items: string[]) {
    if (items.length === 0) return '';

    let level = items.map(item => crypto.createHash('sha256').update(item).digest('hex'));

    while (level.length > 1) {
        const next: string[] = [];

        for (let i = 0; i < level.length; i += 2) {
            if (i + 1 === level.length) {
                next.push(level[i])
            } else {
                next.push(crypto.createHash('sha256').update(level[i] + level[i + 1]).digest('hex'));
            }
        } 
        
        level = next;
    }

    return level[0];
}