import axios from 'axios';
import * as crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:4000';
const HMAC_SECRET = process.env.HMAC_SECRET || 'demo-secret';

function generateHmacSignature(payload: any): string {
    const rawPayload = JSON.stringify(payload);
    return crypto.createHmac('sha256', HMAC_SECRET)
                 .update(rawPayload)
                 .digest('hex');
}

describe('Prism Backend Integration Flow', () => {
    let creatorId: string;
    let consumerId: string;
    let liveId: string;
    let giftId: string;
    let giftLedgerEntryId: string;

    afterAll(async () => {
        await prisma.$disconnect();
    });

    test('1. Create Creator User', async () => {
        const creatorPayload = {
            tiktokId: `creator_tiktok_${Date.now()}`,
            name: "TestCreator",
            role: "creator",
            kycStatus: "verified"
        };
        const creatorRes = await axios.post(`${BASE_URL}/users`, creatorPayload);
        expect(creatorRes.status).toBe(201);
        creatorId = creatorRes.data.id;
    });

    test('2. Create Live Session', async () => {
        expect(creatorId).toBeDefined();
        const livePayload = {
            creatorId,
            startAt: new Date().toISOString()
        };
        const liveRes = await axios.post(`${BASE_URL}/lives`, livePayload);
        expect(liveRes.status).toBe(201);
        liveId = liveRes.data.id;
    });

    test('3. Create Consumer User', async () => {
        const consumerPayload = {
            tiktokId: `consumer_tiktok_${Date.now()}`,
            name: "TestConsumer",
            role: "consumer",
            kycStatus: "none"
        };
        const consumerRes = await axios.post(`${BASE_URL}/users`, consumerPayload);
        expect(consumerRes.status).toBe(201);
        consumerId = consumerRes.data.id;
    });

    test('4. Create required Accounts', async () => {
        expect(creatorId).toBeDefined();
        await axios.post(`${BASE_URL}/accounts`, { ownerId: creatorId, type: 'creator', balance: 0 });
        await axios.post(`${BASE_URL}/accounts`, { type: 'platform', balance: 0 });
        await axios.post(`${BASE_URL}/accounts`, { type: 'reserve', balance: 0 });
    });

    test('5. Send a Gift', async () => {
        expect(liveId).toBeDefined();
        expect(consumerId).toBeDefined();
        const giftPayload = {
            idempotencyKey: `gift-key-${Date.now()}`,
            liveId,
            consumerId,
            coinAmount: 100
        };
        const giftSignature = generateHmacSignature(giftPayload);
        const giftRes = await axios.post(`${BASE_URL}/webhooks/gift`, giftPayload, {
            headers: { 'x-hmac-signature': giftSignature }
        });
        expect(giftRes.status).toBe(200);
        giftId = giftRes.data.gift.id;
    });

    test('6. End Live Session and Trigger Settlement', async () => {
        expect(liveId).toBeDefined();
        const endLiveRes = await axios.post(`${BASE_URL}/lives/${liveId}/end`);
        expect(endLiveRes.status).toBe(200);
    });

    test('7. Get Creator Balance', async () => {
        expect(creatorId).toBeDefined();
        const balanceRes = await axios.get(`${BASE_URL}/creators/${creatorId}/balance`);
        expect(balanceRes.status).toBe(200);
        expect(balanceRes.data.balance).toBeGreaterThanOrEqual(0);
    });

    test('8. Fetch Merkle Proof for a Ledger Entry', async () => {
        expect(giftId).toBeDefined();
        const giftLedgerEntry = await prisma.ledger.findFirst({
            where: { refType: 'gift', refId: giftId },
            orderBy: { createdAt: 'asc' }
        });
        expect(giftLedgerEntry).toBeDefined();
        giftLedgerEntryId = giftLedgerEntry!.id;
        console.log('Fetching Merkle proof for ledger entry:', giftLedgerEntryId);
        const merkleProofRes = await axios.get(`${BASE_URL}/merkle/proof/${giftLedgerEntryId}`);
        expect(merkleProofRes.status).toBe(200);
        expect(merkleProofRes.data).toHaveProperty('proof');
        expect(merkleProofRes.data).toHaveProperty('merkleRoot');
    });
});