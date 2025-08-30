# Prism: Transparent Value-Sharing for Creators

## Problem Statement

TikTok enables creators to earn revenue from content, but designing a fair, transparent, and effective reward mechanism is complex. Challenges include fairness, regulatory compliance, fraud prevention, and misaligned incentives. Prism addresses these by establishing a legitimate, auditable flow of value from consumers to creators, with features for content evaluation, profit-sharing, anti-fraud, and AML compliance.

---

## Features & Functionality

- **Live Session Value Flow:**  
  Consumers send gifts during live sessions; gifts are tracked and settled transparently.
- **Quality Assessment:**  
  Each session is evaluated for content quality, influencing payouts.
- **Profit-Sharing Mechanism:**  
  Gross earnings are split between creators, platform, and a fraud reserve, with all calculations visible.
- **Transparent Ledger:**  
  Every transaction is recorded in a tamper-proof ledger, viewable in the Transparency Explorer.
- **Merkle Proofs:**  
  Users can verify any payout or transaction is included in the official ledger using cryptographic proofs.
- **Fraud Detection:**  
  Gifts and sessions are flagged for suspicious activity; fraud statistics are shown.
- **AML Compliance:**  
  Value transfers are tracked and auditable for regulatory purposes.
- **Cross-Platform UI:**  
  Built with Lynx, the UI runs natively on iOS, Android, and Web from a single codebase.

---

## Development Tools

- **Frontend:** LynxReact (Lynx cross-platform UI framework)
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** PostgreSQL (via Prisma)
- **Version Control:** Git, GitHub

---

## APIs Used

- **Custom Backend APIs (HTTP Endpoints):**  
  - `/lives/:id` — Live session details  
  - `/merkle/snapshot` — Latest Merkle root and ledger IDs  
  - `/ledgers/by-ids` — Ledger entries for a snapshot  
  - `/merkle/proof/:ledgerId` — Merkle proof for any ledger entry  
  - `/creators/:id/balance` — Creator balance  
  - `/lives/:id/settlement` — Settlement details

---

## Libraries Used

- **Frontend:**  
  - `@lynx-js/react` (LynxReact)
- **Backend:**  
  - `express`
  - `@prisma/client`
  - `crypto` (Node.js built-in)
- **Testing:**  
  - `jest` (backend)

---

## How It Works

1. **Consumers send gifts during live sessions.**
2. **Gifts are tracked, evaluated for fraud, and settled.**
3. **Gross earnings are split transparently; platform fees and reserves are calculated.**
4. **All transactions are recorded in a ledger.**
5. **Merkle snapshots are created for auditability; users can verify any transaction’s inclusion.**
6. **UI is consistent and responsive across platforms.**

---

## Demo

- **Demo Video:** 

---

## Submission Notes

- I built Prism as a solo participant of TikTok TechJam 2025, for Track 6: Value-Sharing Reimagined. I also wanted to try out the optional Lynx UI Challenge.
- The debugging and styling process was streamlined using Github Copilot.

---

## Getting Started

1. **Clone the repo:**  
2. **Install dependencies:**  
   - Backend: `cd src/backend && pnpm install`
   - Frontend: `cd src/frontend && pnpm install`
3. **Configure environment variables:**  
   - Backend: `.env` for database and API keys
4. **Run database migrations:**
   - `cd src/backend && pnpm run migrate`
5. **Run with Docker (recommended):**  
   - Make sure you have Docker installed.
   - From the project root, run:  
     `docker-compose up`
6. **Run the backend:**
   - `cd src/backend && pnpm run server`
   - From `src/backend`, database can be viewed using `pnpm run view-db`
7. **Run the app:**
   - `cd src/frontend && pnpm run dev`
   - Visit https://lynxjs.org/guide/start/quick-start.html for details
