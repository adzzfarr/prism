"use strict";
// How to run: 
// pnpm tsc demo/demo-data.ts
// node demo/demo-data.js
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var creator, consumer1, consumer2, consumer3, creatorAccount, holdingAccount, platformAccount, reserveAccount, consumerAccount1, consumerAccount2, consumerAccount3, liveRunning, liveEnded;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Clear existing data
                return [4 /*yield*/, prisma.gift.deleteMany({})];
                case 1:
                    // Clear existing data
                    _a.sent();
                    return [4 /*yield*/, prisma.live.deleteMany({})];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.account.deleteMany({})];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.deleteMany({})];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.ledger.deleteMany({})];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.merkleSnapshot.deleteMany({})];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: { name: 'Alice Creator', id: 'demo-creator', role: 'creator', kycStatus: 'verified' }
                        })];
                case 7:
                    creator = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: { name: 'Bob Fan', role: 'consumer', kycStatus: 'verified' }
                        })];
                case 8:
                    consumer1 = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: { name: 'Charlie Fan', role: 'consumer', kycStatus: 'unverified' }
                        })];
                case 9:
                    consumer2 = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: { name: 'Dana Fan', role: 'consumer', kycStatus: 'verified' }
                        })];
                case 10:
                    consumer3 = _a.sent();
                    return [4 /*yield*/, prisma.account.create({
                            data: { ownerId: creator.id, type: 'creator', balance: 0 }
                        })];
                case 11:
                    creatorAccount = _a.sent();
                    return [4 /*yield*/, prisma.account.create({
                            data: { ownerId: creator.id, type: 'holding', balance: 0 }
                        })];
                case 12:
                    holdingAccount = _a.sent();
                    return [4 /*yield*/, prisma.account.create({
                            data: { type: 'platform', balance: 0 }
                        })];
                case 13:
                    platformAccount = _a.sent();
                    return [4 /*yield*/, prisma.account.create({
                            data: { type: 'reserve', balance: 0 }
                        })];
                case 14:
                    reserveAccount = _a.sent();
                    return [4 /*yield*/, prisma.account.create({
                            data: { ownerId: consumer1.id, type: 'consumer', balance: 5000 }
                        })];
                case 15:
                    consumerAccount1 = _a.sent();
                    return [4 /*yield*/, prisma.account.create({
                            data: { ownerId: consumer2.id, type: 'consumer', balance: 5000 }
                        })];
                case 16:
                    consumerAccount2 = _a.sent();
                    return [4 /*yield*/, prisma.account.create({
                            data: { ownerId: consumer3.id, type: 'consumer', balance: 5000 }
                        })];
                case 17:
                    consumerAccount3 = _a.sent();
                    return [4 /*yield*/, prisma.live.create({
                            data: {
                                creatorId: creator.id,
                                startAt: new Date(Date.now() - 30 * 60 * 1000), // started 30 min ago
                                status: 'running'
                            }
                        })];
                case 18:
                    liveRunning = _a.sent();
                    return [4 /*yield*/, prisma.live.create({
                            data: {
                                creatorId: creator.id,
                                startAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // started 2 hours ago
                                endAt: new Date(Date.now() - 60 * 60 * 1000), // ended 1 hour ago
                                status: 'ended'
                            }
                        })];
                case 19:
                    liveEnded = _a.sent();
                    // Create gifts (various scenarios)
                    return [4 /*yield*/, prisma.gift.create({
                            data: {
                                idempotencyKey: 'gift-1',
                                liveId: liveRunning.id,
                                consumerId: consumer1.id,
                                coinAmount: 100,
                                timestamp: new Date(Date.now() - 25 * 60 * 1000),
                                riskFlag: false
                            }
                        })];
                case 20:
                    // Create gifts (various scenarios)
                    _a.sent();
                    return [4 /*yield*/, prisma.gift.create({
                            data: {
                                idempotencyKey: 'gift-2',
                                liveId: liveRunning.id,
                                consumerId: consumer2.id,
                                coinAmount: 2000, // Large amount, triggers risk
                                timestamp: new Date(Date.now() - 20 * 60 * 1000),
                                riskFlag: true
                            }
                        })];
                case 21:
                    _a.sent();
                    return [4 /*yield*/, prisma.gift.create({
                            data: {
                                idempotencyKey: 'gift-3',
                                liveId: liveRunning.id,
                                consumerId: consumer3.id,
                                coinAmount: 50,
                                timestamp: new Date(Date.now() - 10 * 60 * 1000),
                                riskFlag: false
                            }
                        })];
                case 22:
                    _a.sent();
                    return [4 /*yield*/, prisma.gift.create({
                            data: {
                                idempotencyKey: 'gift-4',
                                liveId: liveEnded.id,
                                consumerId: consumer1.id,
                                coinAmount: 500,
                                timestamp: new Date(Date.now() - 90 * 60 * 1000),
                                riskFlag: false
                            }
                        })];
                case 23:
                    _a.sent();
                    return [4 /*yield*/, prisma.gift.create({
                            data: {
                                idempotencyKey: 'gift-5',
                                liveId: liveEnded.id,
                                consumerId: consumer2.id,
                                coinAmount: 1000,
                                timestamp: new Date(Date.now() - 80 * 60 * 1000),
                                riskFlag: true // Unverified user
                            }
                        })];
                case 24:
                    _a.sent();
                    // Simulate ledger entries for gifts
                    return [4 /*yield*/, prisma.ledger.create({
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
                        })];
                case 25:
                    // Simulate ledger entries for gifts
                    _a.sent();
                    return [4 /*yield*/, prisma.ledger.create({
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
                        })];
                case 26:
                    _a.sent();
                    return [4 /*yield*/, prisma.ledger.create({
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
                        })];
                case 27:
                    _a.sent();
                    // Simulate settlement for ended live
                    return [4 /*yield*/, prisma.ledger.create({
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
                        })];
                case 28:
                    // Simulate settlement for ended live
                    _a.sent();
                    return [4 /*yield*/, prisma.ledger.create({
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
                        })];
                case 29:
                    _a.sent();
                    return [4 /*yield*/, prisma.ledger.create({
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
                        })];
                case 30:
                    _a.sent();
                    // Create a Merkle snapshot for proof
                    return [4 /*yield*/, prisma.merkleSnapshot.create({
                            data: {
                                root: 'demo-merkle-root',
                                signature: 'demo-signature',
                                ledgerIds: [
                                // Add all ledger IDs created above
                                // You can fetch them dynamically if needed
                                ]
                            }
                        })];
                case 31:
                    // Create a Merkle snapshot for proof
                    _a.sent();
                    console.log('Demo data created! Open your frontend to see all features.');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
