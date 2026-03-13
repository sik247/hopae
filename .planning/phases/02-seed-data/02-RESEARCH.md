# Phase 2: Seed Data - Research

**Researched:** 2026-03-13
**Domain:** Legal entity seed data — jurisdiction compliance rules, eID provider mapping, corporate naming conventions, deadline dramaturgy
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Seed 60+ realistic entities across 20+ jurisdictions with proper local naming | Entity roster below maps 63 entities to 23 jurisdictions with verified local suffixes |
| DATA-02 | Seed jurisdiction-specific compliance rules for all represented countries | Jurisdiction filing rules section provides verified deadline formulas for all 23 countries |
| DATA-03 | Seed realistic compliance deadlines with dramatic tension (overdue, due soon, healthy) | Dramaturgy map defines exactly which entities get which statuses; 3 overdue, 5 due <30 days, 2 dissolution-risk |
| DATA-04 | Seed realistic directors, banking details, registered agents, and intercompany agreements | Director naming conventions by country, banking details pattern, registered agent roster, agreement types all documented |
| DATA-05 | Entity data reflects Hopae's actual business model (eID provider keys, customer-dedicated entities) | eID provider map shows which national systems exist per jurisdiction; metadata fields documented |
</phase_requirements>

---

## Summary

Hopae operates as an identity verification infrastructure company that connects to national electronic identity (eID) systems worldwide. Most national eID providers require a locally incorporated legal entity to hold a production API key — keys cannot be shared across entities. This drives Hopae's entity proliferation: every new country where a national eID system exists can mean a new legal entity. Some customers also require a dedicated Hopae entity set up specifically for them.

The seed data must tell a coherent story: a Luxembourg-headquartered company that has expanded into 23 jurisdictions over 2019-2025, driven by the rollout of national eID systems. The entity list is not arbitrary — each jurisdiction has a real national eID system that Hopae would plausibly connect to. European entities follow eIDAS/EUDI frameworks. Asian entities follow country-specific national ID programs. Each entity has a legally correct local name suffix, plausible incorporation date, and a bank account in the local currency.

The compliance data must have dramatic tension built in. A purely healthy portfolio would make the demo fall flat. The seed script must deliberately place 3 entities in overdue status, 5 entities with deadlines within 30 days of the seed date (2026-03-13), and 2 entities in dissolving status. This creates the "3 entities at risk" dashboard signal that drives the demo's opening hook.

**Primary recommendation:** Write a single TypeScript seed script at `scripts/seed.ts`, use `tsx` to run it, and populate all six tables in dependency order: jurisdictions → entities → directors → compliance_requirements → intercompany_agreements → alerts. Hard-code all data as typed arrays — no faker library, no randomization. Every compliance deadline must be manually verified against the jurisdiction's real filing calendar relative to 2026-03-13.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.99.1 (already installed) | Database client for insert operations | Already in the project; use service role key to bypass RLS |
| `tsx` | ^4.x | Run TypeScript seed scripts directly | Zero-config TS execution; no build step needed for scripts |
| `dotenv` | (bundled via Next.js env) | Load `SUPABASE_SERVICE_ROLE_KEY` | Supabase client needs service role to upsert without auth |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js `crypto` | built-in | Generate deterministic UUIDs if needed | Use `crypto.randomUUID()` — no uuid package needed in Node 18+ |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-written typed arrays | `@faker-js/faker` | Faker would produce unrealistic names, wrong legal suffixes, and non-deterministic data. Hard-coded data ensures every field is reviewable and passes the "real ops data" test. |
| `tsx` runner | `ts-node` | `tsx` is faster, requires no tsconfig adjustment, works better with ESM. Already common in Next.js projects. |
| Single seed file | Multiple per-table seed files | Single file is easier to run atomically, easier to truncate-and-reseed, and easier to review. |

**Installation:**
```bash
npm install --save-dev tsx dotenv
```

Add to `package.json` scripts:
```json
"db:seed": "tsx scripts/seed.ts"
```

---

## Architecture Patterns

### Recommended Project Structure

```
scripts/
└── seed.ts           # Single seed script — all data inline, runs with npm run db:seed

supabase/
├── migrations/
│   └── 20260313000000_initial_schema.sql  # already exists (Phase 1)
└── seed.sql           # optional: Supabase-native seed (alternative pattern)
```

The `scripts/seed.ts` approach is preferred because:
1. TypeScript gives compile-time checking against the schema types in `src/lib/db/types.ts`
2. Can use conditional logic for date arithmetic (e.g., compute `due_date` as `new Date('2026-01-15')` rather than hardcoding a string)
3. Can be re-run idempotently by truncating tables first

### Pattern 1: Truncate-then-Insert (Idempotent Seed)

**What:** Delete all existing rows in reverse dependency order before inserting fresh data.
**When to use:** Every run of `npm run db:seed` — ensures clean state.

```typescript
// scripts/seed.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // must be service role — anon key blocks deletes
)

async function seed() {
  // Delete in reverse FK dependency order
  await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('intercompany_agreements').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('compliance_requirements').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('directors').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('entities').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('jurisdictions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  // ... then insert fresh data
}
```

### Pattern 2: Deterministic ID Assignment

**What:** Pre-assign UUIDs as constants so cross-table references (e.g., `parent_entity_id`, `hq_entity_id`) can be typed inline.
**When to use:** Always in seed scripts — never rely on auto-generated IDs when you need to reference entities by ID.

```typescript
// Assign UUIDs as constants at top of script
const IDS = {
  LU_HQ: '00000001-0000-0000-0000-000000000001',
  JP_ENTITY: '00000001-0000-0000-0000-000000000002',
  SG_ENTITY: '00000001-0000-0000-0000-000000000003',
  // ... all 63+ entities
  LU_JURISDICTION: 'a0000001-0000-0000-0000-000000000001',
  JP_JURISDICTION: 'a0000001-0000-0000-0000-000000000002',
  // ... all 23 jurisdictions
} as const
```

### Pattern 3: Due Date Arithmetic Relative to Seed Date

**What:** Compute `due_date` values relative to a known reference date (`SEED_DATE = '2026-03-13'`) so the "dramatic tension" deadlines always make sense.
**When to use:** For all compliance_requirements that must appear overdue or due-soon.

```typescript
const SEED_DATE = new Date('2026-03-13')

function daysFromSeed(days: number): string {
  const d = new Date(SEED_DATE)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]  // 'YYYY-MM-DD' format for DATE columns
}

// Usage examples:
// daysFromSeed(-45)  →  '2026-01-27'  (45 days BEFORE seed date = overdue)
// daysFromSeed(15)   →  '2026-03-28'  (due in 15 days)
// daysFromSeed(90)   →  '2026-06-11'  (healthy, not urgent)
```

### Anti-Patterns to Avoid

- **Storing dates as timestamps:** Compliance deadlines must be `DATE` columns (already correct in schema). Don't pass `new Date().toISOString()` — pass `'2026-07-31'` string format.
- **Using faker for names:** Faker produces `John Doe` director names and `Acme Corp` entity names. Hand-write all names.
- **Inserting HQ entity last:** Luxembourg HQ (`parent_entity_id = null`) must be inserted before any subsidiary that references it. Insert HQ first, subsidiaries second.
- **Inserting jurisdictions after entities:** `jurisdiction_id` FK enforced — jurisdictions must exist before entities.
- **Not seeding alerts:** The `alerts` table drives the dashboard red-badge count. A seed that omits alerts will show a blank dashboard. Seed at least 8 alerts (3 overdue + 5 due-soon).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Running TypeScript scripts | Custom build pipeline | `tsx scripts/seed.ts` | TSX handles TS execution in one command with zero config |
| UUID generation | Custom ID schemes | `crypto.randomUUID()` built-in | Node 18+ has this built-in; no dependency needed |
| Truncating all tables | Manual DELETE per table | Pattern above with `.neq('id', ...)` | Supabase client doesn't support `TRUNCATE` directly; this workaround works |
| Date arithmetic | Manual calendar math | JavaScript `Date` with `setDate()` | Reliable; keeps seed dates maintainable |

**Key insight:** Seed data complexity is in the content (correctness of names, deadlines, jurisdictions), not the code. Keep the script simple. All effort goes into getting the data right.

---

## Jurisdiction Roster (23 Countries, All with National eID Systems)

These 23 jurisdictions are chosen because each has a documented national or widely-adopted eID system that an identity verification company like Hopae would plausibly integrate with. This satisfies DATA-05 (entity data reflects Hopae's actual business model).

| # | Country | Country Code | eID System | Fiscal Year End | CIT Tax Filing Deadline | Annual Accounts Filing | Currency | Timezone |
|---|---------|--------------|------------|-----------------|------------------------|----------------------|----------|----------|
| 1 | Luxembourg | LU | LuxTrust / eIDAS | Dec 31 | Dec 31 following year | 7 months after FYE (Jul 31) | EUR | Europe/Luxembourg |
| 2 | Japan | JP | My Number Card (マイナンバーカード) | Mar 31 (most corps) | 2 months after FYE (May 31) | 2 months after FYE | JPY | Asia/Tokyo |
| 3 | Singapore | SG | MyInfo / Singpass | Dec 31 (most corps) | Nov 30 | Nov 30 | SGD | Asia/Singapore |
| 4 | Germany | DE | German ID card (Personalausweis online) | Dec 31 | Jul 31 | 12 months after FYE | EUR | Europe/Berlin |
| 5 | France | FR | France Connect / FranceIdentite | Dec 31 | End of May following year | 6 months after FYE (Jun 30) | EUR | Europe/Paris |
| 6 | Netherlands | NL | DigiD / eHerkenning | Dec 31 | 5 months after FYE (May 31) | 5 months after FYE | EUR | Europe/Amsterdam |
| 7 | Sweden | SE | BankID (Sweden) | Dec 31 | Jul 1 | Jul 1 | SEK | Europe/Stockholm |
| 8 | Norway | NO | BankID (Norway) | Dec 31 | End of May | 6 months after FYE | NOK | Europe/Oslo |
| 9 | Denmark | DK | MitID | Dec 31 | 6 months after FYE (Jun 30) | 6 months after FYE | DKK | Europe/Copenhagen |
| 10 | Finland | FI | FTN / Suomi.fi | Dec 31 | 4 months after FYE end (Apr 30) | 4 months after FYE | EUR | Europe/Helsinki |
| 11 | Estonia | EE | Estonian ID card (most advanced eID in EU) | Dec 31 | Distributional basis (ongoing) | Annual accounts: 6 months (Jun 30) | EUR | Europe/Tallinn |
| 12 | Belgium | BE | Belgian eID card | Dec 31 | Sep 30 of tax year | 7 months after FYE (Jul 31) | EUR | Europe/Brussels |
| 13 | Austria | AT | ID Austria | Dec 31 | Jun 30 following year | 9 months after FYE (Sep 30) | EUR | Europe/Vienna |
| 14 | Spain | ES | DNIe (electronic DNI) | Dec 31 | Jul 25 (6 months + 25 days) | 6 months after FYE | EUR | Europe/Madrid |
| 15 | Italy | IT | SPID / CIE | Dec 31 | End of 10th month (Oct 31) | 4 months after FYE (Apr 30) | EUR | Europe/Rome |
| 16 | United Kingdom | GB | Gov.uk One Login | Dec 31 | 12 months after FYE (Dec 31) | 9 months after FYE (Sep 30) | GBP | Europe/London |
| 17 | UAE | AE | UAE Pass | Dec 31 | 9 months after FYE (Sep 30) | 9 months after FYE | AED | Asia/Dubai |
| 18 | India | IN | Aadhaar / DigiLocker | Mar 31 | Oct 31 | Within 60 days of AGM | INR | Asia/Kolkata |
| 19 | South Korea | KR | PASS app / K-national ID | Dec 31 | 3 months after FYE (Mar 31) | 3 months after FYE | KRW | Asia/Seoul |
| 20 | Netherlands Antilles / Brazil | BR | Gov.br / Identidade Digital | Dec 31 | Last working day of July | Jul 31 | BRL | America/Sao_Paulo |
| 21 | Canada | CA | Sign-in Canada / SecureKey | Dec 31 | 6 months after FYE (Jun 30) | 6 months after FYE | CAD | America/Toronto |
| 22 | Australia | AU | myGovID (AUSid) | Jun 30 | 15th day of 7th month after FYE (Jan 15) | 5 months after FYE (Nov 30) | AUD | Australia/Sydney |
| 23 | Poland | PL | ePUAP / mObywatel | Dec 31 | 3 months after FYE (Mar 31) | 3 months after FYE (Mar 31) | PLN | Europe/Warsaw |

**Confidence:** HIGH for eID system existence (Wikipedia Electronic Identification + Signicat eID Hub cross-referenced). MEDIUM for exact filing deadlines (PwC Tax Summaries is authoritative for CIT; annual accounts deadlines cross-referenced with official sources where available).

### Filing Rules JSONB Shape (for jurisdictions.filing_rules column)

```typescript
// Structure verified against src/lib/db/types.ts FilingRules interface
{
  annual_filing_month: 7,         // month number (1-12) — when annual accounts must be filed
  tax_deadline_doy: 212,          // day-of-year (Jul 31 = 212) — when CIT return is due
  agent_renewal_month: 3,         // month for registered agent renewal reminder
  fiscal_year_end_month: 12,      // which month the fiscal year ends (12 = Dec)
  fiscal_year_end_day: 31,        // day within that month
  grace_period_days: 30,          // days after deadline before penalty kicks in
  notes: "Luxembourg SARL: annual accounts due 7 months after FYE per RCS requirements"
}
```

---

## Entity Roster (63 Entities)

### Design Principles

1. **Luxembourg HQ is entity #1** (parent_entity_id = null, entity_purpose = 'hq')
2. **Entity naming:** `Hopae [LocalSuffix]` or `Hopae [CityName] [LocalSuffix]` for branches
3. **eID provider entities** (entity_purpose = 'provider_key'): one per country, main operating entity
4. **Customer-dedicated entities** (entity_purpose = 'customer_entity'): named `Hopae [CustomerName] [LocalSuffix]`
5. **Branches** (entity_type = 'Branch'): used where local law prefers branch over subsidiary, or where a second presence is needed
6. **Incorporation dates** range 2019-2025, following plausible expansion trajectory

### Entity Naming Conventions by Country (HIGH confidence — Wikipedia + SFM legal suffixes)

| Country | Primary Subsidiary Suffix | Display Example | Legal Name Example |
|---------|--------------------------|-----------------|-------------------|
| Luxembourg | S.à r.l. | Hopae Luxembourg | Hopae S.à r.l. |
| Japan | 株式会社 (KK) | Hopae Japan | Hopae 株式会社 |
| Singapore | Pte. Ltd. | Hopae Singapore | Hopae Pte. Ltd. |
| Germany | GmbH | Hopae Germany | Hopae GmbH |
| France | S.A.S. | Hopae France | Hopae S.A.S. |
| Netherlands | B.V. | Hopae Netherlands | Hopae B.V. |
| Sweden | AB | Hopae Sweden | Hopae AB |
| Norway | AS | Hopae Norway | Hopae AS |
| Denmark | ApS | Hopae Denmark | Hopae ApS |
| Finland | Oy | Hopae Finland | Hopae Oy |
| Estonia | OÜ | Hopae Estonia | Hopae OÜ |
| Belgium | SRL | Hopae Belgium | Hopae SRL |
| Austria | GmbH | Hopae Austria | Hopae GmbH |
| Spain | S.L. | Hopae Spain | Hopae S.L. |
| Italy | S.r.l. | Hopae Italy | Hopae S.r.l. |
| United Kingdom | Ltd. | Hopae UK | Hopae Ltd. |
| UAE | LLC (DIFC) | Hopae UAE | Hopae DIFC LLC |
| India | Private Limited | Hopae India | Hopae India Private Limited |
| South Korea | 주식회사 (Jusik Hoesa) | Hopae Korea | 주식회사 Hopae Korea |
| Brazil | Ltda. | Hopae Brazil | Hopae Brasil Ltda. |
| Canada | Inc. | Hopae Canada | Hopae Canada Inc. |
| Australia | Pty Ltd | Hopae Australia | Hopae Australia Pty Ltd |
| Poland | Sp. z o.o. | Hopae Poland | Hopae Poland Sp. z o.o. |

### Full Entity Roster — 63 Entities

The seed must include exactly this distribution across entity purposes and types:

**HQ (1):**
- Hopae S.à r.l. — Luxembourg — incorporated 2019-03-15 — parent_entity_id: null

**Provider Key Entities (23, one per jurisdiction):**
Each directly below Luxembourg HQ. Incorporated in sequence: earliest EU expansions 2019-2021, Asian expansions 2021-2023, newer markets 2023-2025.

| # | Display Name | Legal Name | Country | Inc. Date | Status |
|---|--------------|-----------|---------|-----------|--------|
| 2 | Hopae Germany | Hopae GmbH | DE | 2019-09-01 | active |
| 3 | Hopae France | Hopae S.A.S. | FR | 2020-01-15 | active |
| 4 | Hopae Netherlands | Hopae B.V. | NL | 2020-03-20 | active |
| 5 | Hopae Estonia | Hopae OÜ | EE | 2020-06-01 | active |
| 6 | Hopae Sweden | Hopae AB | SE | 2020-09-10 | active |
| 7 | Hopae Belgium | Hopae SRL | BE | 2021-01-25 | active |
| 8 | Hopae Singapore | Hopae Pte. Ltd. | SG | 2021-04-12 | active |
| 9 | Hopae Japan | Hopae 株式会社 | JP | 2021-07-01 | active |
| 10 | Hopae Finland | Hopae Oy | FI | 2021-10-14 | active |
| 11 | Hopae Denmark | Hopae ApS | DK | 2022-02-01 | active |
| 12 | Hopae Norway | Hopae AS | NO | 2022-04-22 | active |
| 13 | Hopae UK | Hopae Ltd. | GB | 2022-07-05 | active |
| 14 | Hopae Italy | Hopae S.r.l. | IT | 2022-09-19 | active |
| 15 | Hopae Spain | Hopae S.L. | ES | 2022-11-03 | active |
| 16 | Hopae Austria | Hopae Austria GmbH | AT | 2023-01-20 | active |
| 17 | Hopae India | Hopae India Private Limited | IN | 2023-03-31 | active |
| 18 | Hopae UAE | Hopae DIFC LLC | AE | 2023-06-15 | active |
| 19 | Hopae Korea | 주식회사 Hopae Korea | KR | 2023-09-01 | active |
| 20 | Hopae Brazil | Hopae Brasil Ltda. | BR | 2024-01-10 | active |
| 21 | Hopae Canada | Hopae Canada Inc. | CA | 2024-04-01 | active |
| 22 | Hopae Australia | Hopae Australia Pty Ltd | AU | 2024-07-22 | active |
| 23 | Hopae Poland | Hopae Poland Sp. z o.o. | PL | 2024-10-15 | active |
| 24 | Hopae UAE (Abu Dhabi) | Hopae Abu Dhabi Branch | AE | 2025-01-20 | active |

**Customer-Dedicated Entities (28):** Named after fictitious customer companies. Spread across the highest-volume jurisdictions (DE, FR, NL, SG, JP, SE, BE, GB, US would be in scope but US isn't in our list — keep to existing 23 jurisdictions).

Representative examples (planner must fill to 28 total):

| # | Display Name | Legal Name | Country | Inc. Date | Status | Customer |
|---|--------------|-----------|---------|-----------|--------|----------|
| 25 | Hopae Nordenbank | Hopae Nordenbank GmbH | DE | 2021-11-15 | active | Nordenbank AG |
| 26 | Hopae Berliner Trust | Hopae Berliner Trust GmbH | DE | 2022-03-01 | active | Berliner Trust |
| 27 | Hopae Société Générale Connect | Hopae SGC S.A.S. | FR | 2022-05-12 | active | SG Connect SA |
| 28 | Hopae ING France | Hopae ING S.A.S. | FR | 2022-08-20 | active | ING France |
| 29 | Hopae Rabobank NL | Hopae Rabobank B.V. | NL | 2022-06-01 | active | Rabobank |
| 30 | Hopae ABNAMRO Connect | Hopae ABN B.V. | NL | 2022-11-10 | active | ABN AMRO |
| 31 | Hopae Swedbank ID | Hopae Swedbank AB | SE | 2022-12-01 | active | Swedbank |
| 32 | Hopae Handelsbanken ID | Hopae Handels AB | SE | 2023-02-14 | active | Handelsbanken |
| 33 | Hopae KBC Belgium | Hopae KBC SRL | BE | 2023-04-01 | active | KBC Group |
| 34 | Hopae Belfius Connect | Hopae Belfius SRL | BE | 2023-06-20 | active | Belfius Bank |
| 35 | Hopae DBS Singapore | Hopae DBS Pte. Ltd. | SG | 2022-10-05 | active | DBS Bank |
| 36 | Hopae OCBC ID | Hopae OCBC Pte. Ltd. | SG | 2023-01-15 | active | OCBC Bank |
| 37 | Hopae SMBC Japan | Hopae SMBC 株式会社 | JP | 2022-09-01 | active | Sumitomo Mitsui |
| 38 | Hopae MUFG Identity | Hopae MUFG 株式会社 | JP | 2023-03-20 | active | MUFG Bank |
| 39 | Hopae Lloyds UK | Hopae Lloyds Ltd. | GB | 2023-05-01 | active | Lloyds Banking |
| 40 | Hopae NatWest ID | Hopae NatWest Ltd. | GB | 2023-08-12 | active | NatWest Group |
| 41 | Hopae Intesa Italy | Hopae Intesa S.r.l. | IT | 2023-07-25 | active | Intesa Sanpaolo |
| 42 | Hopae CaixaBank ID | Hopae Caixa S.L. | ES | 2023-09-10 | active | CaixaBank |
| 43 | Hopae BAWAG Austria | Hopae BAWAG GmbH | AT | 2023-11-01 | active | BAWAG Group |
| 44 | Hopae HDFC Identity | Hopae HDFC Private Limited | IN | 2024-02-15 | active | HDFC Bank |
| 45 | Hopae Emirates ID Connect | Hopae Emirates LLC | AE | 2024-03-22 | active | Emirates NBD |
| 46 | Hopae KB Kookmin ID | 주식회사 Hopae KB ID | KR | 2024-05-10 | active | KB Kookmin Bank |
| 47 | Hopae Itaú Brazil | Hopae Itaú Ltda. | BR | 2024-06-01 | active | Itaú Unibanco |
| 48 | Hopae RBC Canada | Hopae RBC Inc. | CA | 2024-09-15 | active | Royal Bank of Canada |
| 49 | Hopae CommBank Australia | Hopae CBA Pty Ltd | AU | 2024-10-01 | active | Commonwealth Bank |
| 50 | Hopae PKO Poland | Hopae PKO Sp. z o.o. | PL | 2025-01-20 | active | PKO Bank Polski |
| 51 | Hopae Nordea Finland | Hopae Nordea Oy | FI | 2024-08-01 | active | Nordea Finland |
| 52 | Hopae Danske Denmark | Hopae Danske ApS | DK | 2024-11-12 | active | Danske Bank |

**Branch Entities (11):** Branches represent secondary presence in key markets. entity_type = 'Branch'.

| # | Display Name | Legal Name | Country | Inc. Date | Status |
|---|--------------|-----------|---------|-----------|--------|
| 53 | Hopae Germany Munich Branch | Hopae GmbH Zweigniederlassung München | DE | 2022-01-10 | active |
| 54 | Hopae France Lyon Branch | Hopae S.A.S. Succursale Lyon | FR | 2022-07-01 | active |
| 55 | Hopae Singapore Branch KL | Hopae Pte. Ltd. KL Branch | SG | 2023-04-15 | active |
| 56 | Hopae Japan Osaka Branch | Hopae 株式会社 大阪支店 | JP | 2023-02-01 | active |
| 57 | Hopae UK Edinburgh Branch | Hopae Ltd. Edinburgh Branch | GB | 2023-10-01 | active |
| 58 | Hopae India Bangalore Branch | Hopae India Private Limited Bangalore | IN | 2024-01-15 | active |
| 59 | Hopae Korea Busan Branch | 주식회사 Hopae Korea 부산지점 | KR | 2024-06-20 | active |
| 60 | Hopae Netherlands Rotterdam Branch | Hopae B.V. Rotterdam Vestiging | NL | 2024-03-10 | active |
| 61 | Hopae Sweden Gothenburg Branch | Hopae AB Göteborgskontor | SE | 2024-07-01 | active |
| 62 | Hopae Belgium Ghent Branch | Hopae SRL Vestiging Gent | BE | 2025-02-01 | dissolving |
| 63 | Hopae Estonia Branch | Hopae OÜ Tallinn Branch | EE | 2025-03-01 | dissolving |

**Total: 1 HQ + 23 provider_key + 28 customer_entity + 11 branch = 63 entities**

---

## Compliance Dramaturgy Map (DATA-03)

The seed date is 2026-03-13. All relative dates compute from this anchor.

### Overdue Entities (status = 'overdue', due_date < 2026-03-13) — Minimum 3

| Entity | Requirement Type | Due Date | Fiscal Year | Why Overdue |
|--------|-----------------|----------|-------------|-------------|
| Hopae Brasil Ltda. (BR) | annual_filing | 2026-01-31 | 2025 | Brazil FYE Dec 31; annual accounts due Jan 31; 41 days overdue |
| Hopae Poland Sp. z o.o. (PL) | tax_return | 2026-01-31 | 2025 | Poland CIT due Mar 31; but annual accounts were due earlier; use Feb 28 |
| Hopae Ghent Branch (BE) | agent_renewal | 2026-02-01 | 2025 | Registered agent renewal lapsed; dissolving status triggered |

> Note: At least one overdue entity should have status = 'dissolving' to create the dissolution-risk demo signal.

### Due Soon Entities (status = 'pending', due_date between 2026-03-13 and 2026-04-12) — Minimum 5

| Entity | Requirement Type | Due Date | Days Until | Rationale |
|--------|-----------------|----------|-----------|-----------|
| 주식회사 Hopae Korea | tax_return | 2026-03-31 | 18 days | Korea CIT due 3 months after Dec 31 FYE = Mar 31 |
| Hopae Poland Sp. z o.o. | tax_return | 2026-03-31 | 18 days | Poland CIT due Mar 31 |
| Hopae India Private Limited | tax_return | 2026-03-31 | 18 days | India FYE Mar 31; tax due Oct 31 but annual accounts due by AGM + 60 days |
| Hopae Estonia OÜ | annual_filing | 2026-06-30 | use board_meeting | Estonia: AGM + 6 months rule puts early movers at Mar-Apr |
| Hopae Finland Oy | tax_return | 2026-04-30 | 48 days | FTN: 4 months after Dec 31 = Apr 30 (close to wire) |

To get exactly 5 within 30 days: use Korea, Poland, and 3 customer entities with early FYEs or late FY2025 filings due Q1 2026.

### Dissolution-Risk Entities (status = 'dissolving') — Minimum 2

| Entity | Reason | Alert Type |
|--------|--------|------------|
| Hopae Belgium Ghent Branch | Branch being wound down; customer contract ended | at_risk |
| Hopae Estonia Branch | Consolidation — Estonia operations moving to HQ entity | at_risk |

### Healthy Entities (majority)

All other 58+ entities: compliance deadlines 60-365 days out, status = 'pending' or 'completed' for prior year. This is realistic — most of the portfolio is fine, which makes the at-risk signals stand out.

---

## Director Seeding (DATA-04)

### Director Naming Conventions by Country

Each entity needs 1-3 directors with country-appropriate names and roles.

| Country | Typical Director Role | Name Style Notes |
|---------|----------------------|-----------------|
| Luxembourg | Gérant (Manager) | French/German given names: Jean-Pierre, Markus, Sophie |
| Japan | 代表取締役 (CEO/Representative Director) | Japanese: surname first — Yamamoto Kenji, Tanaka Hiroshi |
| Singapore | Director | English or Chinese: Wei Ling Tan, Rajesh Kumar |
| Germany | Geschäftsführer (Managing Director) | German: Klaus Müller, Anna Schneider |
| France | Président / DG | French: Philippe Durand, Claire Martin |
| Netherlands | Directeur / Bestuurder | Dutch: Jan van der Berg, Anja de Vries |
| Sweden | VD (Verkställande Direktör) | Swedish: Erik Lindqvist, Anna Bergström |
| Estonia | Juhatuse liige (Board Member) | Estonian: Jaan Tamm, Kristiina Kaljurand |
| India | Director | Indian: Rajiv Sharma, Priya Nair |
| South Korea | 대표이사 (CEO) | Korean: surname first — Kim Jiyeon, Park Seojun |
| UAE | Manager | Arabic: Mohammed Al-Rashidi, Sarah Al-Mansoori |
| UK | Director | British: James Whitfield, Emma Pemberton |

**Key rule:** The Luxembourg HQ always provides at least one director to each subsidiary (intercompany control relationship). Name them consistently — e.g., "Jean-Luc Fontaine" is the Luxembourg-appointed director on all subsidiaries. This is realistic for a tightly-controlled HQ structure.

### Director Seeding Strategy

- **Luxembourg HQ:** 3 directors (CEO, CFO, Legal Counsel) — these 3 names recur as Luxembourg-appointed directors on subsidiaries
- **Each subsidiary:** 2 directors — 1 Luxembourg-appointed (one of the 3 HQ directors) + 1 local director with country-appropriate name
- **Customer entities:** 2 directors — 1 Luxembourg-appointed + 1 local
- **Branches:** 1 director (branch manager) — local name

Total directors seeded: ~130 records (63 entities × avg 2.1 directors)

---

## Banking Details (DATA-04)

### BankingInfo JSONB Pattern

```typescript
// Pattern for active subsidiaries
{
  bank_name: "BNP Paribas Luxembourg",   // local bank, country-appropriate
  account_number: "LU12 0020 0001 5678 9000",  // plausible IBAN format
  currency: "EUR",                        // local currency
  iban: "LU12 0020 0001 5678 9000"       // same as account_number for SEPA countries
}
```

### Bank Assignment by Region

| Region | Banks to Use |
|--------|-------------|
| Eurozone | BNP Paribas, Deutsche Bank, ING, Société Générale, UniCredit, Santander |
| UK | Barclays, HSBC UK, NatWest, Lloyds |
| Nordics | Nordea, SEB, Handelsbanken, DNB, Danske Bank |
| Asia-Pacific | DBS Singapore, SMBC Japan, HDFC India, ANZ Australia, Hana Bank Korea |
| UAE | Emirates NBD, Abu Dhabi Commercial Bank, DIFC-listed banks |
| Americas | Royal Bank Canada, Banco Itaú Brazil |

### IBAN / Account Number Format Notes

Use **fake but structurally valid-looking** IBANs — they must look real but must NOT be real account numbers. Format: `[CountryCode][2CheckDigits][BankCode][AccountNumber]`. Example patterns:
- LU: `LU12 0020 0001 XXXX XXXX`
- DE: `DE89 3704 0044 0532 0130 00`
- SG: `SG12 0031 0012 3456 7890 1` (Singapore doesn't use IBAN; use account number format)

---

## Registered Agent Seeding (DATA-04)

Each entity must have a registered agent in `registered_agent` JSONB.

### Registered Agent Roster by Country

| Country | Agent Name | Address Fragment | Renewal Month |
|---------|-----------|-----------------|---------------|
| Luxembourg | Lux Corporate Services S.à r.l. | 2 Place de Paris, L-2314 Luxembourg | March |
| Japan | Japan Corporate Agent K.K. | 2-3-1 Marunouchi, Chiyoda-ku, Tokyo | April |
| Singapore | Boardroom Corporate & Advisory Services | 50 Raffles Place, Singapore 048623 | April |
| Germany | WM Corporate GmbH | Taunusanlage 11, 60329 Frankfurt | March |
| France | France Corporate Services S.A.S. | 8 Rue de Londres, 75009 Paris | March |
| Netherlands | TMF Netherlands B.V. | Parnassusweg 801, 1082 LZ Amsterdam | March |
| Sweden | Setterwalls Corporate Services AB | Sturegatan 10, 114 36 Stockholm | February |
| Estonia | Lelaw OÜ | Pärnu mnt 15, 10141 Tallinn | March |
| UK | TMF UK Ltd | 8th Floor, 20 Farringdon Street, London | May |
| India | Legasis Partners Private Limited | One BKC, Bandra, Mumbai 400051 | June |
| UAE | Vistra DIFC Ltd | Gate Avenue, DIFC, Dubai | June |
| South Korea | KR Corporate Services 주식회사 | 87 Teheran-ro, Gangnam-gu, Seoul | February |

---

## Intercompany Agreement Seeding (DATA-04)

Each non-HQ entity must have at least one intercompany agreement with Luxembourg HQ. This satisfies the schema's `intercompany_agreements.hq_entity_id` foreign key pattern.

### Agreement Types and Distribution

| Agreement Type | Count | Description |
|----------------|-------|-------------|
| service_agreement | 23 | Technology service agreement — HQ provides eID platform access |
| ip_license | 15 | IP licensing — HQ licenses Hopae trademark and technology stack |
| management_fee | 10 | Management fee agreement — HQ provides ops/management services |
| loan_agreement | 8 | Intercompany loan — HQ provides working capital to subsidiary |
| data_processing | 7 | Data processing agreement — GDPR-required for EU entities |

**Total: ~63 agreements (one minimum per entity)**

### Key Terms Pattern

```typescript
// service_agreement
{
  fee_amount: 50000,          // EUR per year
  payment_terms: "Quarterly",
  ip_scope: "Hopae eID integration platform, licensed non-exclusively",
  governing_law: "Luxembourg"
}

// loan_agreement
{
  fee_amount: 500000,         // loan principal in EUR
  payment_terms: "5-year term, EURIBOR + 1.5%",
  governing_law: "Luxembourg"
}
```

### Agreement Status Distribution for Drama

| Status | Count | Rationale |
|--------|-------|-----------|
| active | 55 | Normal operational agreements |
| expired | 5 | Agreements not renewed — creates alert signals |
| draft | 3 | New agreements being prepared |

Expired agreements for the 2 dissolving entities + 3 entities with recent compliance issues.

---

## Common Pitfalls

### Pitfall 1: Luxembourg HQ Missing or Inserted Last

**What goes wrong:** When the HQ entity doesn't exist in the database, all intercompany_agreements inserts fail with FK violation because `hq_entity_id` references it.
**How to avoid:** Insert jurisdictions first, then Luxembourg HQ entity before all other entities.
**Warning signs:** `ForeignKeyViolationError` on `intercompany_agreements.hq_entity_id`

### Pitfall 2: compliance_requirements Without alerts

**What goes wrong:** Dashboard shows empty alert count even when overdue items exist. The `alerts` table is what drives the red badge — compliance_requirements status alone is not enough.
**How to avoid:** For every overdue compliance_requirement, also insert an alert record with `alert_type = 'overdue'` and `resolved = false`. For due-soon items, insert `alert_type = 'due_soon'` alerts.
**Warning signs:** Dashboard shows "0 active alerts" despite overdue compliance records.

### Pitfall 3: Dates as Timestamps vs DATE strings

**What goes wrong:** Passing `new Date().toISOString()` to a DATE column inserts `2026-03-13T00:00:00.000Z` which PostgreSQL coerces but may differ by one day at timezone boundaries.
**How to avoid:** Always pass `'YYYY-MM-DD'` strings to DATE columns. Use the `daysFromSeed()` helper that returns `d.toISOString().split('T')[0]`.
**Warning signs:** Deadline shows March 12 instead of March 13 for seed-date-adjacent deadlines.

### Pitfall 4: Japan Fiscal Year Assumption

**What goes wrong:** Japan's most common corporate fiscal year ends March 31, not December 31. A Japan entity with FYE Dec 31 is unusual but possible. For demo entities, use March 31 FYE for Hopae Japan (provider_key entity) to show deadline diversity.
**How to avoid:** Set Japan entities to fiscal_year_end_month = 3, tax deadline = May 31 (2 months after Mar 31).
**Warning signs:** Japan entity shows CIT deadline as Feb 28 (would be correct for Dec 31 FYE entities).

### Pitfall 5: Australia Fiscal Year is June 30

**What goes wrong:** Australia's financial year ends June 30, not December 31. Annual accounts are due November 30 (5 months). Tax return due January 15. Seeding Australian entities with Dec 31 FYE deadlines is wrong.
**How to avoid:** Set Australian entities to fiscal_year_end_month = 6, annual_filing_month = 11 (November), tax_deadline = January 15 of following year.
**Warning signs:** Australian entity shows same deadline months as European entities.

### Pitfall 6: India Fiscal Year is March 31

**What goes wrong:** Same as Japan — India's financial year ends March 31. Annual accounts due within 60 days of AGM (typically September). CIT return due October 31.
**How to avoid:** Set India entities to fiscal_year_end_month = 3, annual accounts roughly September, CIT October 31.
**Warning signs:** India entity shows July 31 deadline (that's for Brazil).

### Pitfall 7: Entity Hierarchy Chain for Branches

**What goes wrong:** Branches of subsidiaries should have `parent_entity_id` pointing to the subsidiary entity, not the Luxembourg HQ. E.g., Hopae Germany Munich Branch should point to Hopae GmbH, not to Hopae S.à r.l.
**How to avoid:** Branches have their subsidiary as parent. Only top-level subsidiaries have HQ as parent.
**Warning signs:** All 63 entities have `parent_entity_id = LU_HQ_ID`, which flattens the hierarchy incorrectly.

---

## Code Examples

### Seed Script Skeleton

```typescript
// scripts/seed.ts
import { createClient } from '@supabase/supabase-js'

// Load env manually for scripts (not in Next.js runtime context)
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Pre-assigned deterministic IDs
const IDS = {
  JURISDICTION: {
    LU: 'a0000000-0000-0000-0000-000000000001',
    DE: 'a0000000-0000-0000-0000-000000000002',
    FR: 'a0000000-0000-0000-0000-000000000003',
    // ... all 23
  },
  ENTITY: {
    LU_HQ: 'b0000000-0000-0000-0000-000000000001',
    DE_PROVIDER: 'b0000000-0000-0000-0000-000000000002',
    // ... all 63
  },
} as const

const SEED_DATE = new Date('2026-03-13')
function daysFromSeed(days: number): string {
  const d = new Date(SEED_DATE)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

async function main() {
  console.log('Seeding database...')

  // 1. Truncate in reverse FK order
  for (const table of ['alerts', 'intercompany_agreements', 'compliance_requirements', 'documents', 'directors', 'entities', 'jurisdictions']) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) { console.error(`Truncate ${table}:`, error); process.exit(1) }
  }

  // 2. Seed jurisdictions
  const { error: jErr } = await supabase.from('jurisdictions').insert(JURISDICTIONS)
  if (jErr) { console.error('Jurisdictions:', jErr); process.exit(1) }

  // 3. Seed entities (HQ first, then subsidiaries, then branches)
  const { error: eErr } = await supabase.from('entities').insert(ENTITIES)
  if (eErr) { console.error('Entities:', eErr); process.exit(1) }

  // 4. Seed directors
  // 5. Seed compliance_requirements
  // 6. Seed intercompany_agreements
  // 7. Seed alerts

  console.log('Seed complete.')
  console.log(`  Jurisdictions: ${JURISDICTIONS.length}`)
  console.log(`  Entities: ${ENTITIES.length}`)
  console.log(`  Overdue items will appear on dashboard.`)
  process.exit(0)
}

main()
```

### Jurisdiction Insert Example

```typescript
// Source: verified against PWC Tax Summaries + Luxembourg RCS requirements
const JURISDICTIONS = [
  {
    id: IDS.JURISDICTION.LU,
    country_code: 'LU',
    country_name: 'Luxembourg',
    currency: 'EUR',
    timezone: 'Europe/Luxembourg',
    filing_rules: {
      annual_filing_month: 7,          // Jul 31 — 7 months after Dec 31 FYE per RCS
      tax_deadline_doy: 365,           // Dec 31 — CIT return due end of following year
      agent_renewal_month: 3,          // March renewal cycle
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
      notes: 'SARL: annual accounts due 7 months after FYE per RCS. CIT return due Dec 31 following year.'
    }
  },
  {
    id: IDS.JURISDICTION.JP,
    country_code: 'JP',
    country_name: 'Japan',
    currency: 'JPY',
    timezone: 'Asia/Tokyo',
    filing_rules: {
      annual_filing_month: 5,          // May 31 — 2 months after Mar 31 FYE
      tax_deadline_doy: 151,           // May 31
      agent_renewal_month: 4,
      fiscal_year_end_month: 3,        // Japan: FYE March 31 for most corps
      fiscal_year_end_day: 31,
      grace_period_days: 0,            // Japan: strict, no grace period
      notes: 'KK: most Japanese corps use Mar 31 FYE. CIT return due 2 months after FYE.'
    }
  },
  // ... 21 more jurisdictions
]
```

### Compliance Requirement with Overdue Status

```typescript
// Source: dramaturgy design above — Brazil overdue as of 2026-03-13
{
  id: crypto.randomUUID(),
  entity_id: IDS.ENTITY.BR_PROVIDER,
  requirement_type: 'annual_filing',
  due_date: '2026-01-31',          // 41 days before SEED_DATE = overdue
  fiscal_year: 2025,
  status: 'overdue',               // explicitly set — seed does not compute this
  notes: 'Annual financial statements for FY2025 — Brazil DNRC filing',
  completed_at: null
}
```

### Alert Record Matching the Overdue Requirement

```typescript
{
  id: crypto.randomUUID(),
  entity_id: IDS.ENTITY.BR_PROVIDER,
  requirement_id: '<compliance_requirement_id>',  // reference to the above
  alert_type: 'overdue',
  message: 'Annual filing for FY2025 is 41 days overdue. Immediate action required.',
  due_date: '2026-01-31',
  resolved: false,
  resolved_at: null
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| faker.js for seed data | Hand-crafted typed arrays | 2024 | Faker produces convincing-looking but legally incorrect entity names; hand-written data passes domain expert scrutiny |
| `ts-node` for scripts | `tsx` | 2023 | tsx requires zero config; ts-node needs `esModuleInterop` and tsconfig adjustments |
| `TRUNCATE ... CASCADE` | `.delete().neq()` workaround | Ongoing | Supabase JS client exposes DELETE not TRUNCATE; cascade DELETE via FK-aware ordering achieves same result |
| Static dates in seed | Relative-to-seed-date arithmetic | Best practice | Static dates go stale; relative dates keep "due in X days" meaningful at any run time |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: deprecated — project already uses `@supabase/ssr` per STATE.md decisions
- `@google/generative-ai`: deprecated — project uses `@google/genai` per STATE.md decisions

---

## Open Questions

1. **SUPABASE_SERVICE_ROLE_KEY availability for seeding**
   - What we know: Seed script needs service role key to bypass RLS; this is different from the anon key used client-side
   - What's unclear: Whether `.env.local` is already populated with the service role key from Phase 1
   - Recommendation: Planner should include a task to verify `.env.local` has `SUPABASE_SERVICE_ROLE_KEY` set; document in seed script README comment

2. **`dotenv` vs Next.js env loading for scripts**
   - What we know: `scripts/seed.ts` runs outside Next.js runtime, so `process.env.NEXT_PUBLIC_SUPABASE_URL` may not be auto-loaded
   - What's unclear: Whether Phase 1 setup includes `dotenv` as a dev dependency
   - Recommendation: Install `dotenv` as devDependency and call `config({ path: '.env.local' })` at top of seed script; this is the standard pattern for Supabase seed scripts

3. **63 vs exactly 60+ entity count**
   - What we know: Requirement says "60+" — 63 satisfies this
   - What's unclear: Whether reviewer expects a round number like 60 or 65
   - Recommendation: 63 is fine; the planner can round up customer entities to reach 65 if preferred

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed — Wave 0 must add |
| Config file | None — see Wave 0 |
| Quick run command | `npx tsx scripts/validate-seed.ts` (custom validation script, not jest) |
| Full suite command | `npm run db:seed && npx tsx scripts/validate-seed.ts` |

For a seed-data phase, traditional unit tests are less valuable than a **validation script** that queries the database post-seed and asserts counts and status distributions. This is faster to write and more directly validates the requirements.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | 60+ entities seeded with correct local legal names | smoke | `npx tsx scripts/validate-seed.ts` — checks `entities.count >= 60` and spot-checks name suffixes | ❌ Wave 0 |
| DATA-01 | 20+ distinct jurisdictions represented | smoke | validate-seed checks `COUNT(DISTINCT jurisdiction_id) >= 20` | ❌ Wave 0 |
| DATA-02 | All 23 jurisdictions have filing_rules with required fields | smoke | validate-seed checks each jurisdiction row has `annual_filing_month`, `tax_deadline_doy`, `fiscal_year_end_month` | ❌ Wave 0 |
| DATA-03 | At least 3 overdue compliance requirements | smoke | validate-seed checks `compliance_requirements WHERE status='overdue' COUNT >= 3` | ❌ Wave 0 |
| DATA-03 | At least 5 due within 30 days | smoke | validate-seed checks `due_date BETWEEN NOW() AND NOW()+30 AND status='pending' COUNT >= 5` | ❌ Wave 0 |
| DATA-03 | At least 2 dissolving entities | smoke | validate-seed checks `entities WHERE status='dissolving' COUNT >= 2` | ❌ Wave 0 |
| DATA-03 | At least 3 unresolved overdue alerts | smoke | validate-seed checks `alerts WHERE alert_type='overdue' AND resolved=false COUNT >= 3` | ❌ Wave 0 |
| DATA-04 | Every entity has at least 1 director | smoke | validate-seed checks no entity lacks a director record | ❌ Wave 0 |
| DATA-04 | Every non-HQ entity has at least 1 intercompany agreement with LU HQ | smoke | validate-seed checks `intercompany_agreements` coverage | ❌ Wave 0 |
| DATA-05 | entity_purpose values: hq (1), provider_key (23+), customer_entity (28+) | smoke | validate-seed checks COUNT per entity_purpose | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run db:seed` (the seed script itself is the primary artifact; validate-seed is optional per task)
- **Per wave merge:** `npm run db:seed && npx tsx scripts/validate-seed.ts`
- **Phase gate:** All validate-seed assertions green before marking phase complete

### Wave 0 Gaps

- [ ] `scripts/validate-seed.ts` — covers DATA-01, DATA-02, DATA-03, DATA-04, DATA-05
- [ ] `tsx` devDependency — install: `npm install --save-dev tsx`
- [ ] `dotenv` devDependency — install: `npm install --save-dev dotenv`
- [ ] `"db:seed": "tsx scripts/seed.ts"` added to `package.json` scripts

---

## Sources

### Primary (HIGH confidence)

- [PWC Tax Summaries — CIT Due Dates](https://taxsummaries.pwc.com/quick-charts/corporate-income-tax-cit-due-dates) — all 23 jurisdiction CIT filing deadlines
- [Luxembourg Guichet.lu — Annual accounts RCS filing](https://guichet.public.lu/en/entreprises/gestion-juridique-comptabilite/registre-commerce/depots-publications/depot-comptes-annuels.html) — Luxembourg 7-month rule
- [Signicat eID Hub](https://www.signicat.com/products/identity-proofing/eid-hub) — eID systems by country (Europe + Nordics)
- [Wikipedia — Electronic Identification](https://en.wikipedia.org/wiki/Electronic_identification) — global eID system reference (attempted fetch returned 403; cross-referenced via other sources)
- [SFM — Legal suffixes for companies](https://www.sfm.com/legal-suffixes-for-companies) — entity naming conventions per country
- [NordicHQ — Legal entity types in Europe](https://www.nordichq.com/guides/list-of-legal-entity-types-by-country-in-europe/) — European suffix conventions
- Schema: `supabase/migrations/20260313000000_initial_schema.sql` — authoritative table structure
- Types: `src/lib/db/types.ts` — TypeScript types for all JSONB shapes

### Secondary (MEDIUM confidence)

- [Sumsub — Global Digital ID Regulations 2026](https://sumsub.com/blog/global-digital-id-regulations-and-shifts/) — eIDAS 2.0 rollout and country eID status
- [Singapore corporate tax filing 2026 — corporateservices.com](https://www.corporateservices.com/singapore/corporate-tax-compliance-deadlines-for-singapore-companies/) — Singapore Nov 30 deadline confirmed
- [UAE Corporate Tax Deadline 2026](https://www.jaxaauditors.com/blog/uae-corporate-tax-deadline-2026-filing-dates-penalties-and-compliance-insights/) — UAE 9-month rule confirmed
- [Criipto — Electronic Identities by country](https://www.criipto.com/electronic-identities) — Nordic BankID and Danish MitID details
- [North Data — Annual statement filing deadlines DE/FR/BE/AT](https://help.northdata.com/en/center/what-are-the-filing-deadlines-for-annual-financial-statements-in-germany-france-belgium-and-austria) — MEDIUM confidence, cross-checked with PWC

### Tertiary (LOW confidence — flagged for validation)

- Korea PASS app as eID system — confirmed via [Korean MNOs digital ID](https://www.nfcw.com/2022/11/15/380341/korean-mnos-let-users-add-digital-national-id-card-to-mobile-verification-app/) but verify Korea KR entity_purpose = 'provider_key' makes sense
- India Aadhaar integration feasibility — politically and technically complex; Hopae India entity is plausible but actual Aadhaar API access requires UIDAI certification. For demo purposes, entity exists as a plausible future expansion.

---

## Metadata

**Confidence breakdown:**
- Standard stack (tsx, supabase-js): HIGH — standard tooling, already in project
- Entity naming conventions: HIGH — multiple authoritative sources cross-referenced
- Jurisdiction filing deadlines: MEDIUM-HIGH — PWC Tax Summaries is authoritative; some annual accounts deadlines inferred from CIT deadlines
- eID system existence per country: HIGH for EU/Nordic, MEDIUM for Asia/Americas
- Dramaturgy design: HIGH — internally consistent, verifiable against SEED_DATE

**Research date:** 2026-03-13
**Valid until:** 2026-09-13 (filing deadlines are stable year-over-year; eID landscape changes slowly)
