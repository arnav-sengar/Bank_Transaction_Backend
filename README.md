# Bank Transaction Backend

A backend system for managing user accounts and money transfers, built to explore how real financial systems handle balances, retries, and atomicity safely.

**Live API:** https://bank-transaction-backend-z2bm.onrender.com 

*(hosted on Render's free tier — the first request after a period of inactivity may take 30-60s to respond while the service spins up)*

## Why this exists

Most CRUD APIs don't have to think about money. This one does — so it's built around a few principles real ledger/payment systems rely on:

- **Balances are derived, not stored.** No mutable `balance` field on an account. Every transaction writes `DEBIT` and `CREDIT` entries to a ledger collection, and balance is computed by summing those entries. This is the same double-entry bookkeeping pattern real financial systems use — it keeps every balance auditable back to the transactions that produced it.
- **Idempotency keys prevent duplicate transactions.** If a client retries a request (timeout, network blip, etc.), the same transaction should never be processed twice. Every transaction requires a unique `idempotencyKey`, checked before any state changes.
- **Transfers are atomic.** Debiting one account and crediting another either both succeed or both fail — handled via MongoDB/Mongoose sessions.

## Tech stack

- Node.js + Express
- MongoDB + Mongoose
- JWT-based authentication (cookie or Bearer token)
- bcrypt for password hashing

## Project structure

```
src/
├── config/        # DB connection
├── controllers/   # Route handlers (auth, account, transaction)
├── middlewares/    # Auth middleware
├── models/         # Mongoose schemas (user, account, transaction, ledger)
└── routes/         # Express routers
```

## API overview

### Auth — `/api/auth`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/register` | Create a new user |
| POST | `/login` | Log in, receive a JWT |
| POST | `/logout` | Log out, clear session token |

### Accounts — `/api/accounts`

| Method | Endpoint | Description | Auth required |
| --- | --- | --- | --- |
| POST | `/` | Create an account for the logged-in user | Yes |

Each user can hold one or more accounts. New accounts default to `ACTIVE` status and `INR` currency.

### Transactions — `/api/transactions`

| Method | Endpoint | Description | Auth required |
| --- | --- | --- | --- |
| POST | `/` | Transfer funds between two existing accounts | Yes |
| POST | `/system/initial-funds` | Seed an account with funds from the system account | Yes (system user) |

All transactions require a unique `idempotencyKey` and validate that both accounts are `ACTIVE` and the sender has sufficient balance (derived from the ledger) before proceeding.

## Data model

- **User** — email, name, hashed password, optional `systemUser` flag
- **Account** — belongs to a user; has `status` (`ACTIVE` / `FROZEN` / `CLOSED`) and `currency`
- **Transaction** — `fromAccount`, `toAccount`, `amount`, `idempotencyKey`, `status` (`PENDING` / `COMPLETE` / `FAILED` / `REVERSED`)
- **Ledger** — individual `DEBIT`/`CREDIT` entries tied to a transaction and an account; the source of truth for balance

## Running locally

```bash
git clone https://github.com/arnav-sengar/Bank_Transaction_Backend.git
cd Bank_Transaction_Backend
npm install
```

Create a `.env` file in the root:

```
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the dev server:

```bash
npm run dev
```

## Status

This is an active learning project — built solo to get hands-on with double-entry ledger design, idempotency, and transactional integrity in a Node/MongoDB backend. Feedback and suggestions are welcome.