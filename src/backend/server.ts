import { PrismaClient } from "@prisma/client";
import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';

const prisma = new PrismaClient();
const app = express();
app.use(bodyParser.json());

// Config
const PLATFORM_ACCOUNT_ID = 'platform-account';
const HMAC_SECRET = process.env.HMAC_SECRET || 'demo-secret';

// Idempotent Gift handler
app.post('/webhooks/gift', async (req, res) => {
    const signature = req.headers['x-hmac-signature'] as string | undefined;
    const raw = JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', HMAC_SECRET).update(raw).digest('hex');

    if (signature !== expected) return res.status(401).send({error: 'Invalid Signature'});

    const {idempotencyKey, liveId, consumerId, coinAmount, timestamp} = req.body;

    // Check if gift already processed
    const existing = await prisma.gift.findUnique({where: {idempotencyKey}});
    if (existing) return res.status(200).send({status: 'already-recorded'});

    // If not, create gift
    const gift = await prisma.gift.create({data: {idempotencyKey, liveId, consumerId, coinAmount}});

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
app.post('/lives/:id/end', async (req, res) => {
    const liveId = req.params.id;
    await prisma.live.update({where: {id: liveId}, data: {endAt: new Date(), status: 'ended'}});

    // Compute quality of live
    const quality = await computeQualityScore(liveId);
    await prisma.live.update({where: {id: liveId}, data: {qualityScore: quality}});

    // Settle the live
    const settlement = await runSettlementForLive(liveId, quality);
    res.send({status: 'settled', settlement});
});

app.get('/creators/:id/balance', async (req, res) => {
    const creatorId = req.params.id;
    const account = await prisma.account.findFirst({where: {ownerId: creatorId, type: 'creator'}});
    res.send({balance: account?.balance ?? 0});
});

app.listen(4000, () => console.log('Listening on 4000'));

async function getHoldingAccountforCreatorByLive(liveId: string) {
    const live = await prisma.live.findUnique({where: {id: liveId}});
    if (!live) throw new Error('Live not found');

    const creatorId = live!.creatorId;
    const account = await prisma.account.findFirst({where: {ownerId: creatorId, type: 'holding'}});
    if (account) return account;

    // If holding account does not exist yet, create one
    return prisma.account.create({data: {ownerId: creatorId, type: 'holding'}});
}

async function createLedgerEntry({debitAccountId, creditAccountId, amount, refType, refId}:{debitAccountId:string, creditAccountId: string, amount: number, refType: string, refId: string}) {
    // Money flows out from debit account to the credit account

    // Compute previous hash
    const prev = await prisma.ledger.findFirst({orderBy: {timestamp: 'desc'}}); 
    const prevHash = prev?.hashThis ?? '';

    // Update previous hash
    const payload = `${debitAccountId}|${creditAccountId}|${amount}|${refType}|${refId}|${Date.now()}`;
    const hash = crypto.createHash('sha256').update(prevHash + payload).digest('hex');

    await prisma.ledger.create({data: {debitAccountId, creditAccountId, amount, refType, refId, hashPrev: prevHash, hashThis: hash}});

    // Update account balances
    // ASK GPT ABOUT: in production use DB transaction + optimistic locking
    const debit = await prisma.account.findUnique({where: {id: debitAccountId}});
    const credit = await prisma.account.findUnique({where: {id: creditAccountId}});

    if (debit) await prisma.account.update({where: {id: debit.id}, data: {balance: debit.balance - amount}});
    if (credit) await prisma.account.update({where: {id: credit.id}, data: {balance: credit.balance + amount}});
}

async function computeQualityScore(liveId: string) {
    // Use gift counts to calculate user retention and user engagement
    const gifts = await prisma.gift.findMany({where: {liveId}});
    const giftCount = gifts.length;

    // Fake metrics for retention and engagement; weights can be adjusted in the real world
    const retention = Math.min(1, 0.3 + giftCount * 0.05);
    const engagement = Math.min(1, 0.15 + giftCount * 0.025);

    // Calculate score; weights can be adjusted in the real world
    const score = Math.round((retention * 0.5 + engagement * 0.5) * 100);
    return score;
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
    const creatorAccount = await prisma.account.findFirst({where: {ownerId: live!.creatorId, type: 'creator'}});
    const platformAccount = await prisma.account.findFirst({where: {type: 'platform'}});
    const reserveAccount = await prisma.account.findFirst({where: {type: 'reserve'}});

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