# DiasporaConnect

Look after family in Kosovo from wherever you live. DiasporaConnect lets people in the diaspora **pay household bills**, **send gifts** from local shops and **book home services** (cleaning, repairs, elderly care) for their relatives, and follow every order until it's done.

It is a three-sided marketplace:

| Role | What they do |
|---|---|
| **Customer** (lives abroad) | Saves family members, pays bills, orders gifts, books services, cancels for refunds, reviews providers |
| **Vendor** (local business) | Applies, gets approved, lists products or services, accepts/rejects orders and walks them to completion |
| **Admin** (operations) | Approves vendors, pays utility providers and records receipt numbers, refunds, disables accounts |

## Tech stack

- **Next.js 15** (App Router, Server Components, Server Actions), **React 19**, **TypeScript** (strict)
- **MongoDB** with **Mongoose 8**
- **Tailwind CSS** + Radix/shadcn primitives
- **zod** for every input, **jose** for signed session cookies, **bcrypt** for passwords

## Getting started

Requirements: Node.js 20+.

```bash
npm install
cp .env.example .env.local   # then fill in SESSION_SECRET
npm run dev
```

### Fastest way to try it: the in-memory database

Set `MONGODB_URI=memory` in `.env.local`. The app starts a throwaway MongoDB and fills it with demo data (vendors, products, services and a customer with orders). The first run downloads the MongoDB binary (~780 MB, cached afterwards). Data is gone when the server stops.

Demo accounts (password `demo-pass-2026`, local only):

| Email | Role |
|---|---|
| `arben@demo.test` | Customer with family members and orders |
| `flora@demo.test` | Approved gift shop |
| `pastrim@demo.test` | Approved cleaning service |
| `admin@demo.test` | Operations |

### Using a real database

```bash
# .env.local
MONGODB_URI=mongodb://127.0.0.1:27017/diaspora-connect
SEED_ADMIN_EMAIL=you@example.com
SEED_ADMIN_PASSWORD=<at least 12 characters>

npm run seed            # creates the admin account
npm run seed -- --demo  # optional: demo vendors, catalog and orders (refused in production)
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests for workflows and money handling (`node:test`) |
| `npm run test:integration` | Every order workflow against a real in-memory MongoDB: payments, refunds, permissions, double-booking, races |
| `npm run seed` | Admin account, plus demo data with `--demo` |

## How it's built

```
app/
  (auth)/            login, register + their server actions
  (app)/             signed-in area (one shell, navigation per role)
    dashboard, family, bills, gifts, services, activity   customer
    vendor/          vendor workspace
    admin/           operations
    notifications, settings                                every role
lib/
  domain/workflow.ts   order state machines (who can move what, where)
  domain/catalog.ts    Kosovo cities, utility providers, categories
  services/            business logic: orders, vendor, admin, payments ledger
  models.ts            Mongoose schemas
  validation.ts        zod schemas for every form
  auth/                password hashing, session tokens, requireUser()
  payments.ts          payment provider interface (test provider today)
middleware.ts          role-based route protection
```

### Order workflows

Every status change goes through `lib/domain/workflow.ts`, which defines who may move an order from one status to the next and whether that transition refunds the customer. The UI renders action buttons from the same definitions, so the screens can't drift from the rules.

```
Gift order:  awaiting_payment → placed → accepted → out_for_delivery → delivered
                                  ├→ rejected  (vendor, refund)
                                  └→ cancelled (customer/admin, refund)

Booking:     awaiting_payment → requested → confirmed → in_progress → completed → review
                                  ├→ declined  (vendor, refund)
                                  └→ cancelled (customer/admin until work starts, refund)

Bill:        awaiting_payment → paid → settled  (admin records provider receipt)
                                  └→ refunded (admin, refund)
```

Status updates are **atomic compare-and-set** (`findOneAndUpdate` matching the expected current status), so two people acting at once can't both succeed, which means no double refunds.

### Money

- Amounts are stored as **integer cents** in EUR. No floating-point money.
- A service fee (2.5%, min €0.99, max €9.99) is added on top. Vendors see their payout, customers see the breakdown.
- Every charge and refund is written to a `Transaction` ledger, shown to customers on the Payments page.
- Orders store a **snapshot** of the recipient and line items, so editing a family member or product never rewrites history.

### Payments

`lib/payments.ts` defines a `PaymentProvider` interface. The only implementation today is the **test provider**, which approves instantly and moves no money. The UI labels this clearly. Adding Stripe means writing one more provider plus a webhook; order code doesn't change.

### Security

- Sessions are signed JWTs in an **httpOnly, SameSite=Lax** cookie (secure in production). Nothing is kept in localStorage.
- `middleware.ts` keeps each role in its own area. Every page and action also calls `requireUser()`, which re-reads the user from the database so disabled accounts lose access immediately.
- All input is validated with zod on the server. Every query is scoped to the owner, vendor or admin, and other people's ids return "not found".
- Passwords are hashed with bcrypt (cost 12). Login is rate limited and returns the same message and timing for unknown emails.
- The app refuses to start without a strong `SESSION_SECRET`, and `MONGODB_URI=memory` is blocked in production.
- Security headers are set in `next.config.ts`.

## Roadmap

- Stripe provider + webhook (the interface is ready)
- Albanian / English translations (`next-intl`)
- Photo proof of delivery and product images (object storage)
- Redis-backed rate limiting for multi-instance deployments
- E2E tests (Playwright) for the three main flows
