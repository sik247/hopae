// scripts/seed.ts — Seed script for Hopae entity management platform
// Populates jurisdictions, entities, and directors with hand-crafted realistic data.
// Run with: npm run db:seed

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SEED_DATE = new Date('2026-03-13')

function daysFromSeed(days: number): string {
  const d = new Date(SEED_DATE)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// Deterministic IDs
// ---------------------------------------------------------------------------

export const IDS = {
  JURISDICTION: {
    LU: 'a0000000-0000-0000-0000-000000000001',
    JP: 'a0000000-0000-0000-0000-000000000002',
    SG: 'a0000000-0000-0000-0000-000000000003',
    DE: 'a0000000-0000-0000-0000-000000000004',
    FR: 'a0000000-0000-0000-0000-000000000005',
    NL: 'a0000000-0000-0000-0000-000000000006',
    SE: 'a0000000-0000-0000-0000-000000000007',
    NO: 'a0000000-0000-0000-0000-000000000008',
    DK: 'a0000000-0000-0000-0000-000000000009',
    FI: 'a0000000-0000-0000-0000-000000000010',
    EE: 'a0000000-0000-0000-0000-000000000011',
    BE: 'a0000000-0000-0000-0000-000000000012',
    AT: 'a0000000-0000-0000-0000-000000000013',
    ES: 'a0000000-0000-0000-0000-000000000014',
    IT: 'a0000000-0000-0000-0000-000000000015',
    GB: 'a0000000-0000-0000-0000-000000000016',
    AE: 'a0000000-0000-0000-0000-000000000017',
    IN: 'a0000000-0000-0000-0000-000000000018',
    KR: 'a0000000-0000-0000-0000-000000000019',
    BR: 'a0000000-0000-0000-0000-000000000020',
    CA: 'a0000000-0000-0000-0000-000000000021',
    AU: 'a0000000-0000-0000-0000-000000000022',
    PL: 'a0000000-0000-0000-0000-000000000023',
  },
  ENTITY: {
    LU_HQ:              'b0000000-0000-0000-0000-000000000001',
    // Provider key entities (23)
    DE_PROVIDER:        'b0000000-0000-0000-0000-000000000002',
    FR_PROVIDER:        'b0000000-0000-0000-0000-000000000003',
    NL_PROVIDER:        'b0000000-0000-0000-0000-000000000004',
    EE_PROVIDER:        'b0000000-0000-0000-0000-000000000005',
    SE_PROVIDER:        'b0000000-0000-0000-0000-000000000006',
    BE_PROVIDER:        'b0000000-0000-0000-0000-000000000007',
    SG_PROVIDER:        'b0000000-0000-0000-0000-000000000008',
    JP_PROVIDER:        'b0000000-0000-0000-0000-000000000009',
    FI_PROVIDER:        'b0000000-0000-0000-0000-000000000010',
    DK_PROVIDER:        'b0000000-0000-0000-0000-000000000011',
    NO_PROVIDER:        'b0000000-0000-0000-0000-000000000012',
    GB_PROVIDER:        'b0000000-0000-0000-0000-000000000013',
    IT_PROVIDER:        'b0000000-0000-0000-0000-000000000014',
    ES_PROVIDER:        'b0000000-0000-0000-0000-000000000015',
    AT_PROVIDER:        'b0000000-0000-0000-0000-000000000016',
    IN_PROVIDER:        'b0000000-0000-0000-0000-000000000017',
    AE_PROVIDER:        'b0000000-0000-0000-0000-000000000018',
    KR_PROVIDER:        'b0000000-0000-0000-0000-000000000019',
    BR_PROVIDER:        'b0000000-0000-0000-0000-000000000020',
    CA_PROVIDER:        'b0000000-0000-0000-0000-000000000021',
    AU_PROVIDER:        'b0000000-0000-0000-0000-000000000022',
    PL_PROVIDER:        'b0000000-0000-0000-0000-000000000023',
    AE_ABU_DHABI:       'b0000000-0000-0000-0000-000000000024',
    // Customer entities (28)
    DE_NORDENBANK:      'b0000000-0000-0000-0000-000000000025',
    DE_BERLINER:        'b0000000-0000-0000-0000-000000000026',
    FR_SGC:             'b0000000-0000-0000-0000-000000000027',
    FR_ING:             'b0000000-0000-0000-0000-000000000028',
    NL_RABOBANK:        'b0000000-0000-0000-0000-000000000029',
    NL_ABN:             'b0000000-0000-0000-0000-000000000030',
    SE_SWEDBANK:        'b0000000-0000-0000-0000-000000000031',
    SE_HANDELS:         'b0000000-0000-0000-0000-000000000032',
    BE_KBC:             'b0000000-0000-0000-0000-000000000033',
    BE_BELFIUS:         'b0000000-0000-0000-0000-000000000034',
    SG_DBS:             'b0000000-0000-0000-0000-000000000035',
    SG_OCBC:            'b0000000-0000-0000-0000-000000000036',
    JP_SMBC:            'b0000000-0000-0000-0000-000000000037',
    JP_MUFG:            'b0000000-0000-0000-0000-000000000038',
    GB_LLOYDS:          'b0000000-0000-0000-0000-000000000039',
    GB_NATWEST:         'b0000000-0000-0000-0000-000000000040',
    IT_INTESA:          'b0000000-0000-0000-0000-000000000041',
    ES_CAIXA:           'b0000000-0000-0000-0000-000000000042',
    AT_BAWAG:           'b0000000-0000-0000-0000-000000000043',
    IN_HDFC:            'b0000000-0000-0000-0000-000000000044',
    AE_EMIRATES:        'b0000000-0000-0000-0000-000000000045',
    KR_KB:              'b0000000-0000-0000-0000-000000000046',
    BR_ITAU:            'b0000000-0000-0000-0000-000000000047',
    CA_RBC:             'b0000000-0000-0000-0000-000000000048',
    AU_CBA:             'b0000000-0000-0000-0000-000000000049',
    PL_PKO:             'b0000000-0000-0000-0000-000000000050',
    FI_NORDEA:          'b0000000-0000-0000-0000-000000000051',
    DK_DANSKE:          'b0000000-0000-0000-0000-000000000052',
    // Branch entities (11)
    DE_MUNICH_BRANCH:   'b0000000-0000-0000-0000-000000000053',
    FR_LYON_BRANCH:     'b0000000-0000-0000-0000-000000000054',
    SG_KL_BRANCH:       'b0000000-0000-0000-0000-000000000055',
    JP_OSAKA_BRANCH:    'b0000000-0000-0000-0000-000000000056',
    GB_EDINBURGH_BRANCH:'b0000000-0000-0000-0000-000000000057',
    IN_BANGALORE_BRANCH:'b0000000-0000-0000-0000-000000000058',
    KR_BUSAN_BRANCH:    'b0000000-0000-0000-0000-000000000059',
    NL_ROTTERDAM_BRANCH:'b0000000-0000-0000-0000-000000000060',
    SE_GOTEBORG_BRANCH: 'b0000000-0000-0000-0000-000000000061',
    BE_GHENT_BRANCH:    'b0000000-0000-0000-0000-000000000062',
    EE_TALLINN_BRANCH:  'b0000000-0000-0000-0000-000000000063',
  },
} as const

// ---------------------------------------------------------------------------
// Jurisdictions (23 rows)
// ---------------------------------------------------------------------------

const JURISDICTIONS = [
  {
    id: IDS.JURISDICTION.LU,
    country_code: 'LU',
    country_name: 'Luxembourg',
    currency: 'EUR',
    timezone: 'Europe/Luxembourg',
    filing_rules: {
      annual_filing_month: 7,
      tax_deadline_doy: 365,
      agent_renewal_month: 3,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
      notes: 'SARL: annual accounts due 7 months after FYE per RCS. CIT return due Dec 31 following year.',
    },
  },
  {
    id: IDS.JURISDICTION.JP,
    country_code: 'JP',
    country_name: 'Japan',
    currency: 'JPY',
    timezone: 'Asia/Tokyo',
    filing_rules: {
      annual_filing_month: 5,
      tax_deadline_doy: 151,
      agent_renewal_month: 4,
      fiscal_year_end_month: 3,
      fiscal_year_end_day: 31,
      grace_period_days: 0,
      notes: 'KK: most Japanese corps use Mar 31 FYE. CIT return due 2 months after FYE.',
    },
  },
  {
    id: IDS.JURISDICTION.SG,
    country_code: 'SG',
    country_name: 'Singapore',
    currency: 'SGD',
    timezone: 'Asia/Singapore',
    filing_rules: {
      annual_filing_month: 11,
      tax_deadline_doy: 334,
      agent_renewal_month: 4,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
      notes: 'Pte. Ltd.: annual return due Nov 30. ECI filing within 3 months of FYE.',
    },
  },
  {
    id: IDS.JURISDICTION.DE,
    country_code: 'DE',
    country_name: 'Germany',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    filing_rules: {
      annual_filing_month: 12,
      tax_deadline_doy: 212,
      agent_renewal_month: 3,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
      notes: 'GmbH: annual accounts due 12 months after FYE. CIT return due Jul 31.',
    },
  },
  {
    id: IDS.JURISDICTION.FR,
    country_code: 'FR',
    country_name: 'France',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    filing_rules: {
      annual_filing_month: 6,
      tax_deadline_doy: 150,
      agent_renewal_month: 3,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 15,
      notes: 'S.A.S.: annual accounts due 6 months after FYE (Jun 30). CIT return due end of May.',
    },
  },
  {
    id: IDS.JURISDICTION.NL,
    country_code: 'NL',
    country_name: 'Netherlands',
    currency: 'EUR',
    timezone: 'Europe/Amsterdam',
    filing_rules: {
      annual_filing_month: 5,
      tax_deadline_doy: 151,
      agent_renewal_month: 3,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
      notes: 'B.V.: annual accounts due 5 months after FYE (May 31). CIT return due May 31.',
    },
  },
  {
    id: IDS.JURISDICTION.SE,
    country_code: 'SE',
    country_name: 'Sweden',
    currency: 'SEK',
    timezone: 'Europe/Stockholm',
    filing_rules: {
      annual_filing_month: 7,
      tax_deadline_doy: 182,
      agent_renewal_month: 2,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 14,
      notes: 'AB: annual accounts and CIT return due Jul 1.',
    },
  },
  {
    id: IDS.JURISDICTION.NO,
    country_code: 'NO',
    country_name: 'Norway',
    currency: 'NOK',
    timezone: 'Europe/Oslo',
    filing_rules: {
      annual_filing_month: 6,
      tax_deadline_doy: 151,
      agent_renewal_month: 3,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 14,
      notes: 'AS: annual accounts due 6 months after FYE. Tax return due end of May.',
    },
  },
  {
    id: IDS.JURISDICTION.DK,
    country_code: 'DK',
    country_name: 'Denmark',
    currency: 'DKK',
    timezone: 'Europe/Copenhagen',
    filing_rules: {
      annual_filing_month: 6,
      tax_deadline_doy: 181,
      agent_renewal_month: 3,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
      notes: 'ApS: annual accounts due 6 months after FYE (Jun 30). CIT due Jun 30.',
    },
  },
  {
    id: IDS.JURISDICTION.FI,
    country_code: 'FI',
    country_name: 'Finland',
    currency: 'EUR',
    timezone: 'Europe/Helsinki',
    filing_rules: {
      annual_filing_month: 4,
      tax_deadline_doy: 120,
      agent_renewal_month: 3,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
      notes: 'Oy: annual accounts and CIT return due 4 months after FYE (Apr 30).',
    },
  },
  {
    id: IDS.JURISDICTION.EE,
    country_code: 'EE',
    country_name: 'Estonia',
    currency: 'EUR',
    timezone: 'Europe/Tallinn',
    filing_rules: {
      annual_filing_month: 6,
      tax_deadline_doy: 181,
      agent_renewal_month: 3,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
      notes: 'OU: annual accounts due 6 months after FYE (Jun 30). No CIT until distribution.',
    },
  },
  {
    id: IDS.JURISDICTION.BE,
    country_code: 'BE',
    country_name: 'Belgium',
    currency: 'EUR',
    timezone: 'Europe/Brussels',
    filing_rules: {
      annual_filing_month: 7,
      tax_deadline_doy: 273,
      agent_renewal_month: 3,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
      notes: 'SRL: annual accounts due 7 months after FYE (Jul 31). CIT return due Sep 30.',
    },
  },
  {
    id: IDS.JURISDICTION.AT,
    country_code: 'AT',
    country_name: 'Austria',
    currency: 'EUR',
    timezone: 'Europe/Vienna',
    filing_rules: {
      annual_filing_month: 9,
      tax_deadline_doy: 181,
      agent_renewal_month: 3,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
      notes: 'GmbH: annual accounts due 9 months after FYE (Sep 30). CIT due Jun 30.',
    },
  },
  {
    id: IDS.JURISDICTION.ES,
    country_code: 'ES',
    country_name: 'Spain',
    currency: 'EUR',
    timezone: 'Europe/Madrid',
    filing_rules: {
      annual_filing_month: 6,
      tax_deadline_doy: 206,
      agent_renewal_month: 3,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
      notes: 'S.L.: annual accounts due 6 months after FYE. CIT due Jul 25.',
    },
  },
  {
    id: IDS.JURISDICTION.IT,
    country_code: 'IT',
    country_name: 'Italy',
    currency: 'EUR',
    timezone: 'Europe/Rome',
    filing_rules: {
      annual_filing_month: 4,
      tax_deadline_doy: 304,
      agent_renewal_month: 3,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
      notes: 'S.r.l.: annual accounts due 4 months after FYE (Apr 30). CIT due Oct 31.',
    },
  },
  {
    id: IDS.JURISDICTION.GB,
    country_code: 'GB',
    country_name: 'United Kingdom',
    currency: 'GBP',
    timezone: 'Europe/London',
    filing_rules: {
      annual_filing_month: 9,
      tax_deadline_doy: 365,
      agent_renewal_month: 5,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 14,
      notes: 'Ltd.: annual accounts due 9 months after FYE (Sep 30). Corporation tax due 12 months after FYE.',
    },
  },
  {
    id: IDS.JURISDICTION.AE,
    country_code: 'AE',
    country_name: 'United Arab Emirates',
    currency: 'AED',
    timezone: 'Asia/Dubai',
    filing_rules: {
      annual_filing_month: 9,
      tax_deadline_doy: 273,
      agent_renewal_month: 6,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
      notes: 'DIFC LLC: annual return due 9 months after FYE. CIT introduced 2023, due Sep 30.',
    },
  },
  {
    id: IDS.JURISDICTION.IN,
    country_code: 'IN',
    country_name: 'India',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    filing_rules: {
      annual_filing_month: 9,
      tax_deadline_doy: 304,
      agent_renewal_month: 6,
      fiscal_year_end_month: 3,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
      notes: 'Private Limited: FYE Mar 31. AGM within 6 months, annual return within 60 days of AGM. CIT due Oct 31.',
    },
  },
  {
    id: IDS.JURISDICTION.KR,
    country_code: 'KR',
    country_name: 'South Korea',
    currency: 'KRW',
    timezone: 'Asia/Seoul',
    filing_rules: {
      annual_filing_month: 3,
      tax_deadline_doy: 90,
      agent_renewal_month: 2,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 15,
      notes: 'Jusik Hoesa: annual accounts and CIT due 3 months after FYE (Mar 31).',
    },
  },
  {
    id: IDS.JURISDICTION.BR,
    country_code: 'BR',
    country_name: 'Brazil',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    filing_rules: {
      annual_filing_month: 7,
      tax_deadline_doy: 212,
      agent_renewal_month: 3,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
      notes: 'Ltda.: annual financial statements due last working day of Jul. CIT due Jul 31.',
    },
  },
  {
    id: IDS.JURISDICTION.CA,
    country_code: 'CA',
    country_name: 'Canada',
    currency: 'CAD',
    timezone: 'America/Toronto',
    filing_rules: {
      annual_filing_month: 6,
      tax_deadline_doy: 181,
      agent_renewal_month: 3,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 30,
      notes: 'Inc.: annual return due 6 months after FYE (Jun 30). CIT due Jun 30.',
    },
  },
  {
    id: IDS.JURISDICTION.AU,
    country_code: 'AU',
    country_name: 'Australia',
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    filing_rules: {
      annual_filing_month: 11,
      tax_deadline_doy: 15,
      agent_renewal_month: 3,
      fiscal_year_end_month: 6,
      fiscal_year_end_day: 30,
      grace_period_days: 28,
      notes: 'Pty Ltd: FYE Jun 30. Annual accounts due Nov 30 (5 months). Tax return due Jan 15 following year.',
    },
  },
  {
    id: IDS.JURISDICTION.PL,
    country_code: 'PL',
    country_name: 'Poland',
    currency: 'PLN',
    timezone: 'Europe/Warsaw',
    filing_rules: {
      annual_filing_month: 3,
      tax_deadline_doy: 90,
      agent_renewal_month: 3,
      fiscal_year_end_month: 12,
      fiscal_year_end_day: 31,
      grace_period_days: 14,
      notes: 'Sp. z o.o.: annual accounts and CIT return due 3 months after FYE (Mar 31).',
    },
  },
]

// ---------------------------------------------------------------------------
// Entities (63 rows) — inserted in FK-safe order
// ---------------------------------------------------------------------------

// Helper to build entity objects
function entity(
  id: string,
  name: string,
  legal_name: string,
  entity_type: string,
  entity_purpose: 'hq' | 'provider_key' | 'customer_entity' | 'branch',
  jurisdiction_id: string,
  parent_entity_id: string | null,
  incorporation_date: string,
  registration_number: string,
  status: 'active' | 'dissolving',
  banking_info: Record<string, unknown>,
  registered_agent: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
) {
  return {
    id,
    name,
    legal_name,
    entity_type,
    entity_purpose,
    jurisdiction_id,
    parent_entity_id,
    incorporation_date,
    registration_number,
    status,
    banking_info,
    registered_agent,
    metadata,
  }
}

const HQ_ID = IDS.ENTITY.LU_HQ

const ENTITIES = [
  // ---- HQ (1) ----
  entity(
    IDS.ENTITY.LU_HQ, 'Hopae Luxembourg', 'Hopae S.a r.l.', 'S.a r.l.', 'hq',
    IDS.JURISDICTION.LU, null, '2019-03-15', 'B 234567',
    'active',
    { bank_name: 'BNP Paribas Luxembourg', account_number: 'LU28 0019 4006 4475 0000', currency: 'EUR', iban: 'LU28 0019 4006 4475 0000' },
    { name: 'Lux Corporate Services S.a r.l.', address: '2 Place de Paris, L-2314 Luxembourg', renewal_date: daysFromSeed(15), email: 'registry@luxcorp.lu' },
    { role: 'headquarters' },
  ),

  // ---- Provider Key Entities (23) ----
  entity(
    IDS.ENTITY.DE_PROVIDER, 'Hopae Germany', 'Hopae GmbH', 'GmbH', 'provider_key',
    IDS.JURISDICTION.DE, HQ_ID, '2019-09-01', 'HRB 123456',
    'active',
    { bank_name: 'Deutsche Bank', account_number: 'DE89 3704 0044 0532 0130 00', currency: 'EUR', iban: 'DE89 3704 0044 0532 0130 00' },
    { name: 'WM Corporate GmbH', address: 'Taunusanlage 11, 60329 Frankfurt', renewal_date: daysFromSeed(15), email: 'agents@wmcorp.de' },
    { eid_system: 'Personalausweis online', eid_provider_key_id: 'DE-HOPAE-2019-001' },
  ),
  entity(
    IDS.ENTITY.FR_PROVIDER, 'Hopae France', 'Hopae S.A.S.', 'S.A.S.', 'provider_key',
    IDS.JURISDICTION.FR, HQ_ID, '2020-01-15', 'RCS Paris B 845 123 456',
    'active',
    { bank_name: 'Societe Generale', account_number: 'FR76 3000 6000 0112 3456 7890 189', currency: 'EUR', iban: 'FR76 3000 6000 0112 3456 7890 189' },
    { name: 'France Corporate Services S.A.S.', address: '8 Rue de Londres, 75009 Paris', renewal_date: daysFromSeed(15), email: 'agents@frcorp.fr' },
    { eid_system: 'France Connect / FranceIdentite', eid_provider_key_id: 'FR-HOPAE-2020-001' },
  ),
  entity(
    IDS.ENTITY.NL_PROVIDER, 'Hopae Netherlands', 'Hopae B.V.', 'B.V.', 'provider_key',
    IDS.JURISDICTION.NL, HQ_ID, '2020-03-20', 'KVK 76543210',
    'active',
    { bank_name: 'ING Bank', account_number: 'NL91 ABNA 0417 1643 00', currency: 'EUR', iban: 'NL91 ABNA 0417 1643 00' },
    { name: 'TMF Netherlands B.V.', address: 'Parnassusweg 801, 1082 LZ Amsterdam', renewal_date: daysFromSeed(15), email: 'agents@tmf.nl' },
    { eid_system: 'DigiD / eHerkenning', eid_provider_key_id: 'NL-HOPAE-2020-001' },
  ),
  entity(
    IDS.ENTITY.EE_PROVIDER, 'Hopae Estonia', 'Hopae OU', 'OU', 'provider_key',
    IDS.JURISDICTION.EE, HQ_ID, '2020-06-01', '14567890',
    'active',
    { bank_name: 'LHV Pank', account_number: 'EE38 2200 2210 2014 5678', currency: 'EUR', iban: 'EE38 2200 2210 2014 5678' },
    { name: 'Lelaw OU', address: 'Parnu mnt 15, 10141 Tallinn', renewal_date: daysFromSeed(15), email: 'agents@lelaw.ee' },
    { eid_system: 'Estonian ID card', eid_provider_key_id: 'EE-HOPAE-2020-001' },
  ),
  entity(
    IDS.ENTITY.SE_PROVIDER, 'Hopae Sweden', 'Hopae AB', 'AB', 'provider_key',
    IDS.JURISDICTION.SE, HQ_ID, '2020-09-10', '559123-4567',
    'active',
    { bank_name: 'SEB', account_number: 'SE45 5000 0000 0583 9825 7466', currency: 'SEK', iban: 'SE45 5000 0000 0583 9825 7466' },
    { name: 'Setterwalls Corporate Services AB', address: 'Sturegatan 10, 114 36 Stockholm', renewal_date: daysFromSeed(15), email: 'agents@setterwalls.se' },
    { eid_system: 'BankID (Sweden)', eid_provider_key_id: 'SE-HOPAE-2020-001' },
  ),
  entity(
    IDS.ENTITY.BE_PROVIDER, 'Hopae Belgium', 'Hopae SRL', 'SRL', 'provider_key',
    IDS.JURISDICTION.BE, HQ_ID, '2021-01-25', 'BE 0765.432.109',
    'active',
    { bank_name: 'BNP Paribas Fortis', account_number: 'BE68 5390 0754 7034', currency: 'EUR', iban: 'BE68 5390 0754 7034' },
    { name: 'Linklaters LLP Brussels', address: 'Rue Brederode 13, 1000 Brussels', renewal_date: daysFromSeed(15), email: 'agents@linklaters.be' },
    { eid_system: 'Belgian eID card', eid_provider_key_id: 'BE-HOPAE-2021-001' },
  ),
  entity(
    IDS.ENTITY.SG_PROVIDER, 'Hopae Singapore', 'Hopae Pte. Ltd.', 'Pte. Ltd.', 'provider_key',
    IDS.JURISDICTION.SG, HQ_ID, '2021-04-12', '202112345G',
    'active',
    { bank_name: 'DBS Bank', account_number: '003-912345-6', currency: 'SGD', iban: '' },
    { name: 'Boardroom Corporate & Advisory Services', address: '50 Raffles Place, Singapore 048623', renewal_date: daysFromSeed(15), email: 'agents@boardroom.sg' },
    { eid_system: 'MyInfo / Singpass', eid_provider_key_id: 'SG-HOPAE-2021-001' },
  ),
  entity(
    IDS.ENTITY.JP_PROVIDER, 'Hopae Japan', 'Hopae \u682a\u5f0f\u4f1a\u793e', '\u682a\u5f0f\u4f1a\u793e', 'provider_key',
    IDS.JURISDICTION.JP, HQ_ID, '2021-07-01', '0100-01-123456',
    'active',
    { bank_name: 'SMBC', account_number: '0009-123-4567890', currency: 'JPY', iban: '' },
    { name: 'Japan Corporate Agent K.K.', address: '2-3-1 Marunouchi, Chiyoda-ku, Tokyo', renewal_date: daysFromSeed(30), email: 'agents@jpcorp.jp' },
    { eid_system: 'My Number Card', eid_provider_key_id: 'JP-HOPAE-2021-001' },
  ),
  entity(
    IDS.ENTITY.FI_PROVIDER, 'Hopae Finland', 'Hopae Oy', 'Oy', 'provider_key',
    IDS.JURISDICTION.FI, HQ_ID, '2021-10-14', '3456789-1',
    'active',
    { bank_name: 'Nordea Finland', account_number: 'FI21 1234 5600 0007 85', currency: 'EUR', iban: 'FI21 1234 5600 0007 85' },
    { name: 'Fondia Oyj', address: 'Kaivokatu 10 A, 00100 Helsinki', renewal_date: daysFromSeed(15), email: 'agents@fondia.fi' },
    { eid_system: 'FTN / Suomi.fi', eid_provider_key_id: 'FI-HOPAE-2021-001' },
  ),
  entity(
    IDS.ENTITY.DK_PROVIDER, 'Hopae Denmark', 'Hopae ApS', 'ApS', 'provider_key',
    IDS.JURISDICTION.DK, HQ_ID, '2022-02-01', 'CVR 41234567',
    'active',
    { bank_name: 'Danske Bank', account_number: 'DK50 0040 0440 1162 43', currency: 'DKK', iban: 'DK50 0040 0440 1162 43' },
    { name: 'Kromann Reumert', address: 'Sundkrogsgade 5, 2100 Copenhagen', renewal_date: daysFromSeed(15), email: 'agents@kromann.dk' },
    { eid_system: 'MitID', eid_provider_key_id: 'DK-HOPAE-2022-001' },
  ),
  entity(
    IDS.ENTITY.NO_PROVIDER, 'Hopae Norway', 'Hopae AS', 'AS', 'provider_key',
    IDS.JURISDICTION.NO, HQ_ID, '2022-04-22', '912 345 678',
    'active',
    { bank_name: 'DNB', account_number: 'NO93 8601 1117 947', currency: 'NOK', iban: 'NO93 8601 1117 947' },
    { name: 'Wikborg Rein', address: 'Dronning Mauds gate 11, 0250 Oslo', renewal_date: daysFromSeed(15), email: 'agents@wikborg.no' },
    { eid_system: 'BankID (Norway)', eid_provider_key_id: 'NO-HOPAE-2022-001' },
  ),
  entity(
    IDS.ENTITY.GB_PROVIDER, 'Hopae UK', 'Hopae Ltd.', 'Ltd.', 'provider_key',
    IDS.JURISDICTION.GB, HQ_ID, '2022-07-05', '14567890',
    'active',
    { bank_name: 'Barclays', account_number: 'GB29 NWBK 6016 1331 9268 19', currency: 'GBP', iban: 'GB29 NWBK 6016 1331 9268 19' },
    { name: 'TMF UK Ltd', address: '8th Floor, 20 Farringdon Street, London', renewal_date: daysFromSeed(60), email: 'agents@tmf.co.uk' },
    { eid_system: 'Gov.uk One Login', eid_provider_key_id: 'GB-HOPAE-2022-001' },
  ),
  entity(
    IDS.ENTITY.IT_PROVIDER, 'Hopae Italy', 'Hopae S.r.l.', 'S.r.l.', 'provider_key',
    IDS.JURISDICTION.IT, HQ_ID, '2022-09-19', 'MI-2345678',
    'active',
    { bank_name: 'UniCredit', account_number: 'IT60 X054 2811 1010 0000 0123 456', currency: 'EUR', iban: 'IT60 X054 2811 1010 0000 0123 456' },
    { name: 'Studio Legale Toffoletto', address: 'Via Rovello 12, 20121 Milano', renewal_date: daysFromSeed(15), email: 'agents@toffoletto.it' },
    { eid_system: 'SPID / CIE', eid_provider_key_id: 'IT-HOPAE-2022-001' },
  ),
  entity(
    IDS.ENTITY.ES_PROVIDER, 'Hopae Spain', 'Hopae S.L.', 'S.L.', 'provider_key',
    IDS.JURISDICTION.ES, HQ_ID, '2022-11-03', 'B-12345678',
    'active',
    { bank_name: 'Santander', account_number: 'ES91 2100 0418 4502 0005 1332', currency: 'EUR', iban: 'ES91 2100 0418 4502 0005 1332' },
    { name: 'Garrigues', address: 'Hermosilla 3, 28001 Madrid', renewal_date: daysFromSeed(15), email: 'agents@garrigues.es' },
    { eid_system: 'DNIe', eid_provider_key_id: 'ES-HOPAE-2022-001' },
  ),
  entity(
    IDS.ENTITY.AT_PROVIDER, 'Hopae Austria', 'Hopae Austria GmbH', 'GmbH', 'provider_key',
    IDS.JURISDICTION.AT, HQ_ID, '2023-01-20', 'FN 567890 d',
    'active',
    { bank_name: 'Erste Bank', account_number: 'AT61 1904 3002 3457 3201', currency: 'EUR', iban: 'AT61 1904 3002 3457 3201' },
    { name: 'Binder Groesswang', address: 'Sterngasse 13, 1010 Vienna', renewal_date: daysFromSeed(15), email: 'agents@bfrg.at' },
    { eid_system: 'ID Austria', eid_provider_key_id: 'AT-HOPAE-2023-001' },
  ),
  entity(
    IDS.ENTITY.IN_PROVIDER, 'Hopae India', 'Hopae India Private Limited', 'Private Limited', 'provider_key',
    IDS.JURISDICTION.IN, HQ_ID, '2023-03-31', 'U72200MH2023PTC123456',
    'active',
    { bank_name: 'HDFC Bank', account_number: '50200012345678', currency: 'INR', iban: '' },
    { name: 'Legasis Partners Private Limited', address: 'One BKC, Bandra, Mumbai 400051', renewal_date: daysFromSeed(90), email: 'agents@legasis.in' },
    { eid_system: 'Aadhaar / DigiLocker', eid_provider_key_id: 'IN-HOPAE-2023-001' },
  ),
  entity(
    IDS.ENTITY.AE_PROVIDER, 'Hopae UAE', 'Hopae DIFC LLC', 'LLC', 'provider_key',
    IDS.JURISDICTION.AE, HQ_ID, '2023-06-15', 'DIFC-CL-5678',
    'active',
    { bank_name: 'Emirates NBD', account_number: 'AE070331234567890123456', currency: 'AED', iban: 'AE07 0331 2345 6789 0123 456' },
    { name: 'Vistra DIFC Ltd', address: 'Gate Avenue, DIFC, Dubai', renewal_date: daysFromSeed(90), email: 'agents@vistra.ae' },
    { eid_system: 'UAE Pass', eid_provider_key_id: 'AE-HOPAE-2023-001' },
  ),
  entity(
    IDS.ENTITY.KR_PROVIDER, 'Hopae Korea', '\uc8fc\uc2dd\ud68c\uc0ac Hopae Korea', '\uc8fc\uc2dd\ud68c\uc0ac', 'provider_key',
    IDS.JURISDICTION.KR, HQ_ID, '2023-09-01', '110111-8901234',
    'active',
    { bank_name: 'Hana Bank', account_number: 'KR-218-910456-01-001', currency: 'KRW', iban: '' },
    { name: 'KR Corporate Services \uc8fc\uc2dd\ud68c\uc0ac', address: '87 Teheran-ro, Gangnam-gu, Seoul', renewal_date: daysFromSeed(15), email: 'agents@krcorp.kr' },
    { eid_system: 'PASS app / K-national ID', eid_provider_key_id: 'KR-HOPAE-2023-001' },
  ),
  entity(
    IDS.ENTITY.BR_PROVIDER, 'Hopae Brazil', 'Hopae Brasil Ltda.', 'Ltda.', 'provider_key',
    IDS.JURISDICTION.BR, HQ_ID, '2024-01-10', 'CNPJ 12.345.678/0001-90',
    'active',
    { bank_name: 'Banco Itau', account_number: 'BR18 0036 0305 0000 1000 9795 493P 1', currency: 'BRL', iban: 'BR18 0036 0305 0000 1000 9795 493P 1' },
    { name: 'Mattos Filho', address: 'Alameda Joaquim Eugenio de Lima, 447, Sao Paulo', renewal_date: daysFromSeed(15), email: 'agents@mattosfilho.com.br' },
    { eid_system: 'Gov.br / Identidade Digital', eid_provider_key_id: 'BR-HOPAE-2024-001' },
  ),
  entity(
    IDS.ENTITY.CA_PROVIDER, 'Hopae Canada', 'Hopae Canada Inc.', 'Inc.', 'provider_key',
    IDS.JURISDICTION.CA, HQ_ID, '2024-04-01', 'BC1234567',
    'active',
    { bank_name: 'Royal Bank of Canada', account_number: 'CA-003-12345-678', currency: 'CAD', iban: '' },
    { name: 'Torys LLP', address: '79 Wellington St W, Toronto, ON', renewal_date: daysFromSeed(15), email: 'agents@torys.ca' },
    { eid_system: 'Sign-in Canada / SecureKey', eid_provider_key_id: 'CA-HOPAE-2024-001' },
  ),
  entity(
    IDS.ENTITY.AU_PROVIDER, 'Hopae Australia', 'Hopae Australia Pty Ltd', 'Pty Ltd', 'provider_key',
    IDS.JURISDICTION.AU, HQ_ID, '2024-07-22', 'ACN 654 321 098',
    'active',
    { bank_name: 'ANZ Bank', account_number: 'AU-013-000-123456789', currency: 'AUD', iban: '' },
    { name: 'Herbert Smith Freehills', address: 'Level 34, 161 Castlereagh St, Sydney', renewal_date: daysFromSeed(15), email: 'agents@hsf.com.au' },
    { eid_system: 'myGovID (AUSid)', eid_provider_key_id: 'AU-HOPAE-2024-001' },
  ),
  entity(
    IDS.ENTITY.PL_PROVIDER, 'Hopae Poland', 'Hopae Poland Sp. z o.o.', 'Sp. z o.o.', 'provider_key',
    IDS.JURISDICTION.PL, HQ_ID, '2024-10-15', 'KRS 0000987654',
    'active',
    { bank_name: 'PKO Bank Polski', account_number: 'PL61 1090 1014 0000 0712 1981 2874', currency: 'PLN', iban: 'PL61 1090 1014 0000 0712 1981 2874' },
    { name: 'Wardynski & Partners', address: 'Al. Ujazdowskie 10, 00-478 Warsaw', renewal_date: daysFromSeed(15), email: 'agents@wardynski.pl' },
    { eid_system: 'ePUAP / mObywatel', eid_provider_key_id: 'PL-HOPAE-2024-001' },
  ),
  entity(
    IDS.ENTITY.AE_ABU_DHABI, 'Hopae UAE (Abu Dhabi)', 'Hopae Abu Dhabi Branch', 'Branch', 'provider_key',
    IDS.JURISDICTION.AE, HQ_ID, '2025-01-20', 'ADGM-CL-9012',
    'active',
    { bank_name: 'Abu Dhabi Commercial Bank', account_number: 'AE41 0271 2345 6789 0123 456', currency: 'AED', iban: 'AE41 0271 2345 6789 0123 456' },
    { name: 'Vistra DIFC Ltd', address: 'Al Maryah Island, Abu Dhabi', renewal_date: daysFromSeed(90), email: 'agents@vistra.ae' },
    { eid_system: 'UAE Pass', eid_provider_key_id: 'AE-HOPAE-2025-002' },
  ),

  // ---- Customer-Dedicated Entities (28) ----
  entity(
    IDS.ENTITY.DE_NORDENBANK, 'Hopae Nordenbank', 'Hopae Nordenbank GmbH', 'GmbH', 'customer_entity',
    IDS.JURISDICTION.DE, HQ_ID, '2021-11-15', 'HRB 234567',
    'active',
    { bank_name: 'Deutsche Bank', account_number: 'DE55 5001 0517 5407 3249 31', currency: 'EUR', iban: 'DE55 5001 0517 5407 3249 31' },
    { name: 'WM Corporate GmbH', address: 'Taunusanlage 11, 60329 Frankfurt', renewal_date: daysFromSeed(15), email: 'agents@wmcorp.de' },
    { customer: 'Nordenbank AG' },
  ),
  entity(
    IDS.ENTITY.DE_BERLINER, 'Hopae Berliner Trust', 'Hopae Berliner Trust GmbH', 'GmbH', 'customer_entity',
    IDS.JURISDICTION.DE, HQ_ID, '2022-03-01', 'HRB 345678',
    'active',
    { bank_name: 'Commerzbank', account_number: 'DE31 3704 0044 0112 0130 00', currency: 'EUR', iban: 'DE31 3704 0044 0112 0130 00' },
    { name: 'WM Corporate GmbH', address: 'Taunusanlage 11, 60329 Frankfurt', renewal_date: daysFromSeed(15), email: 'agents@wmcorp.de' },
    { customer: 'Berliner Trust' },
  ),
  entity(
    IDS.ENTITY.FR_SGC, 'Hopae Societe Generale Connect', 'Hopae SGC S.A.S.', 'S.A.S.', 'customer_entity',
    IDS.JURISDICTION.FR, HQ_ID, '2022-05-12', 'RCS Paris B 845 234 567',
    'active',
    { bank_name: 'Societe Generale', account_number: 'FR76 3000 6000 0212 3456 7890 189', currency: 'EUR', iban: 'FR76 3000 6000 0212 3456 7890 189' },
    { name: 'France Corporate Services S.A.S.', address: '8 Rue de Londres, 75009 Paris', renewal_date: daysFromSeed(15), email: 'agents@frcorp.fr' },
    { customer: 'SG Connect SA' },
  ),
  entity(
    IDS.ENTITY.FR_ING, 'Hopae ING France', 'Hopae ING S.A.S.', 'S.A.S.', 'customer_entity',
    IDS.JURISDICTION.FR, HQ_ID, '2022-08-20', 'RCS Paris B 845 345 678',
    'active',
    { bank_name: 'BNP Paribas', account_number: 'FR76 3000 6000 0312 3456 7890 189', currency: 'EUR', iban: 'FR76 3000 6000 0312 3456 7890 189' },
    { name: 'France Corporate Services S.A.S.', address: '8 Rue de Londres, 75009 Paris', renewal_date: daysFromSeed(15), email: 'agents@frcorp.fr' },
    { customer: 'ING France' },
  ),
  entity(
    IDS.ENTITY.NL_RABOBANK, 'Hopae Rabobank NL', 'Hopae Rabobank B.V.', 'B.V.', 'customer_entity',
    IDS.JURISDICTION.NL, HQ_ID, '2022-06-01', 'KVK 87654321',
    'active',
    { bank_name: 'Rabobank', account_number: 'NL39 RABO 0300 0652 64', currency: 'EUR', iban: 'NL39 RABO 0300 0652 64' },
    { name: 'TMF Netherlands B.V.', address: 'Parnassusweg 801, 1082 LZ Amsterdam', renewal_date: daysFromSeed(15), email: 'agents@tmf.nl' },
    { customer: 'Rabobank' },
  ),
  entity(
    IDS.ENTITY.NL_ABN, 'Hopae ABNAMRO Connect', 'Hopae ABN B.V.', 'B.V.', 'customer_entity',
    IDS.JURISDICTION.NL, HQ_ID, '2022-11-10', 'KVK 98765432',
    'active',
    { bank_name: 'ABN AMRO', account_number: 'NL02 ABNA 0123 4567 89', currency: 'EUR', iban: 'NL02 ABNA 0123 4567 89' },
    { name: 'TMF Netherlands B.V.', address: 'Parnassusweg 801, 1082 LZ Amsterdam', renewal_date: daysFromSeed(15), email: 'agents@tmf.nl' },
    { customer: 'ABN AMRO' },
  ),
  entity(
    IDS.ENTITY.SE_SWEDBANK, 'Hopae Swedbank ID', 'Hopae Swedbank AB', 'AB', 'customer_entity',
    IDS.JURISDICTION.SE, HQ_ID, '2022-12-01', '559234-5678',
    'active',
    { bank_name: 'Swedbank', account_number: 'SE35 5000 0000 0549 1000 0003', currency: 'SEK', iban: 'SE35 5000 0000 0549 1000 0003' },
    { name: 'Setterwalls Corporate Services AB', address: 'Sturegatan 10, 114 36 Stockholm', renewal_date: daysFromSeed(15), email: 'agents@setterwalls.se' },
    { customer: 'Swedbank' },
  ),
  entity(
    IDS.ENTITY.SE_HANDELS, 'Hopae Handelsbanken ID', 'Hopae Handels AB', 'AB', 'customer_entity',
    IDS.JURISDICTION.SE, HQ_ID, '2023-02-14', '559345-6789',
    'active',
    { bank_name: 'Handelsbanken', account_number: 'SE72 6000 0000 0009 4567 89', currency: 'SEK', iban: 'SE72 6000 0000 0009 4567 89' },
    { name: 'Setterwalls Corporate Services AB', address: 'Sturegatan 10, 114 36 Stockholm', renewal_date: daysFromSeed(15), email: 'agents@setterwalls.se' },
    { customer: 'Handelsbanken' },
  ),
  entity(
    IDS.ENTITY.BE_KBC, 'Hopae KBC Belgium', 'Hopae KBC SRL', 'SRL', 'customer_entity',
    IDS.JURISDICTION.BE, HQ_ID, '2023-04-01', 'BE 0876.543.210',
    'active',
    { bank_name: 'KBC Bank', account_number: 'BE71 0961 2345 6769', currency: 'EUR', iban: 'BE71 0961 2345 6769' },
    { name: 'Linklaters LLP Brussels', address: 'Rue Brederode 13, 1000 Brussels', renewal_date: daysFromSeed(15), email: 'agents@linklaters.be' },
    { customer: 'KBC Group' },
  ),
  entity(
    IDS.ENTITY.BE_BELFIUS, 'Hopae Belfius Connect', 'Hopae Belfius SRL', 'SRL', 'customer_entity',
    IDS.JURISDICTION.BE, HQ_ID, '2023-06-20', 'BE 0987.654.321',
    'active',
    { bank_name: 'Belfius Bank', account_number: 'BE56 0689 0999 9999', currency: 'EUR', iban: 'BE56 0689 0999 9999' },
    { name: 'Linklaters LLP Brussels', address: 'Rue Brederode 13, 1000 Brussels', renewal_date: daysFromSeed(15), email: 'agents@linklaters.be' },
    { customer: 'Belfius Bank' },
  ),
  entity(
    IDS.ENTITY.SG_DBS, 'Hopae DBS Singapore', 'Hopae DBS Pte. Ltd.', 'Pte. Ltd.', 'customer_entity',
    IDS.JURISDICTION.SG, HQ_ID, '2022-10-05', '202212345H',
    'active',
    { bank_name: 'DBS Bank', account_number: '003-923456-7', currency: 'SGD', iban: '' },
    { name: 'Boardroom Corporate & Advisory Services', address: '50 Raffles Place, Singapore 048623', renewal_date: daysFromSeed(15), email: 'agents@boardroom.sg' },
    { customer: 'DBS Bank' },
  ),
  entity(
    IDS.ENTITY.SG_OCBC, 'Hopae OCBC ID', 'Hopae OCBC Pte. Ltd.', 'Pte. Ltd.', 'customer_entity',
    IDS.JURISDICTION.SG, HQ_ID, '2023-01-15', '202312345J',
    'active',
    { bank_name: 'OCBC Bank', account_number: '501-234567-001', currency: 'SGD', iban: '' },
    { name: 'Boardroom Corporate & Advisory Services', address: '50 Raffles Place, Singapore 048623', renewal_date: daysFromSeed(15), email: 'agents@boardroom.sg' },
    { customer: 'OCBC Bank' },
  ),
  entity(
    IDS.ENTITY.JP_SMBC, 'Hopae SMBC Japan', 'Hopae SMBC \u682a\u5f0f\u4f1a\u793e', '\u682a\u5f0f\u4f1a\u793e', 'customer_entity',
    IDS.JURISDICTION.JP, HQ_ID, '2022-09-01', '0100-01-234567',
    'active',
    { bank_name: 'Sumitomo Mitsui Banking', account_number: '0009-234-5678901', currency: 'JPY', iban: '' },
    { name: 'Japan Corporate Agent K.K.', address: '2-3-1 Marunouchi, Chiyoda-ku, Tokyo', renewal_date: daysFromSeed(30), email: 'agents@jpcorp.jp' },
    { customer: 'Sumitomo Mitsui' },
  ),
  entity(
    IDS.ENTITY.JP_MUFG, 'Hopae MUFG Identity', 'Hopae MUFG \u682a\u5f0f\u4f1a\u793e', '\u682a\u5f0f\u4f1a\u793e', 'customer_entity',
    IDS.JURISDICTION.JP, HQ_ID, '2023-03-20', '0100-01-345678',
    'active',
    { bank_name: 'MUFG Bank', account_number: '0005-345-6789012', currency: 'JPY', iban: '' },
    { name: 'Japan Corporate Agent K.K.', address: '2-3-1 Marunouchi, Chiyoda-ku, Tokyo', renewal_date: daysFromSeed(30), email: 'agents@jpcorp.jp' },
    { customer: 'MUFG Bank' },
  ),
  entity(
    IDS.ENTITY.GB_LLOYDS, 'Hopae Lloyds UK', 'Hopae Lloyds Ltd.', 'Ltd.', 'customer_entity',
    IDS.JURISDICTION.GB, HQ_ID, '2023-05-01', '14678901',
    'active',
    { bank_name: 'Lloyds Banking Group', account_number: 'GB82 WEST 1234 5698 7654 32', currency: 'GBP', iban: 'GB82 WEST 1234 5698 7654 32' },
    { name: 'TMF UK Ltd', address: '8th Floor, 20 Farringdon Street, London', renewal_date: daysFromSeed(60), email: 'agents@tmf.co.uk' },
    { customer: 'Lloyds Banking' },
  ),
  entity(
    IDS.ENTITY.GB_NATWEST, 'Hopae NatWest ID', 'Hopae NatWest Ltd.', 'Ltd.', 'customer_entity',
    IDS.JURISDICTION.GB, HQ_ID, '2023-08-12', '14789012',
    'active',
    { bank_name: 'NatWest Group', account_number: 'GB29 NWBK 6016 1331 9268 20', currency: 'GBP', iban: 'GB29 NWBK 6016 1331 9268 20' },
    { name: 'TMF UK Ltd', address: '8th Floor, 20 Farringdon Street, London', renewal_date: daysFromSeed(60), email: 'agents@tmf.co.uk' },
    { customer: 'NatWest Group' },
  ),
  entity(
    IDS.ENTITY.IT_INTESA, 'Hopae Intesa Italy', 'Hopae Intesa S.r.l.', 'S.r.l.', 'customer_entity',
    IDS.JURISDICTION.IT, HQ_ID, '2023-07-25', 'MI-3456789',
    'active',
    { bank_name: 'Intesa Sanpaolo', account_number: 'IT40 S054 2811 1010 0000 0234 567', currency: 'EUR', iban: 'IT40 S054 2811 1010 0000 0234 567' },
    { name: 'Studio Legale Toffoletto', address: 'Via Rovello 12, 20121 Milano', renewal_date: daysFromSeed(15), email: 'agents@toffoletto.it' },
    { customer: 'Intesa Sanpaolo' },
  ),
  entity(
    IDS.ENTITY.ES_CAIXA, 'Hopae CaixaBank ID', 'Hopae Caixa S.L.', 'S.L.', 'customer_entity',
    IDS.JURISDICTION.ES, HQ_ID, '2023-09-10', 'B-23456789',
    'active',
    { bank_name: 'CaixaBank', account_number: 'ES80 2100 0813 6101 2345 6789', currency: 'EUR', iban: 'ES80 2100 0813 6101 2345 6789' },
    { name: 'Garrigues', address: 'Hermosilla 3, 28001 Madrid', renewal_date: daysFromSeed(15), email: 'agents@garrigues.es' },
    { customer: 'CaixaBank' },
  ),
  entity(
    IDS.ENTITY.AT_BAWAG, 'Hopae BAWAG Austria', 'Hopae BAWAG GmbH', 'GmbH', 'customer_entity',
    IDS.JURISDICTION.AT, HQ_ID, '2023-11-01', 'FN 678901 d',
    'active',
    { bank_name: 'BAWAG P.S.K.', account_number: 'AT48 6000 0000 0012 3456', currency: 'EUR', iban: 'AT48 6000 0000 0012 3456' },
    { name: 'Binder Groesswang', address: 'Sterngasse 13, 1010 Vienna', renewal_date: daysFromSeed(15), email: 'agents@bfrg.at' },
    { customer: 'BAWAG Group' },
  ),
  entity(
    IDS.ENTITY.IN_HDFC, 'Hopae HDFC Identity', 'Hopae HDFC Private Limited', 'Private Limited', 'customer_entity',
    IDS.JURISDICTION.IN, HQ_ID, '2024-02-15', 'U72200MH2024PTC234567',
    'active',
    { bank_name: 'HDFC Bank', account_number: '50200023456789', currency: 'INR', iban: '' },
    { name: 'Legasis Partners Private Limited', address: 'One BKC, Bandra, Mumbai 400051', renewal_date: daysFromSeed(90), email: 'agents@legasis.in' },
    { customer: 'HDFC Bank' },
  ),
  entity(
    IDS.ENTITY.AE_EMIRATES, 'Hopae Emirates ID Connect', 'Hopae Emirates LLC', 'LLC', 'customer_entity',
    IDS.JURISDICTION.AE, HQ_ID, '2024-03-22', 'DIFC-CL-6789',
    'active',
    { bank_name: 'Emirates NBD', account_number: 'AE32 0331 2345 6789 0234 567', currency: 'AED', iban: 'AE32 0331 2345 6789 0234 567' },
    { name: 'Vistra DIFC Ltd', address: 'Gate Avenue, DIFC, Dubai', renewal_date: daysFromSeed(90), email: 'agents@vistra.ae' },
    { customer: 'Emirates NBD' },
  ),
  entity(
    IDS.ENTITY.KR_KB, 'Hopae KB Kookmin ID', '\uc8fc\uc2dd\ud68c\uc0ac Hopae KB ID', '\uc8fc\uc2dd\ud68c\uc0ac', 'customer_entity',
    IDS.JURISDICTION.KR, HQ_ID, '2024-05-10', '110111-9012345',
    'active',
    { bank_name: 'KB Kookmin Bank', account_number: 'KR-467-910567-01-001', currency: 'KRW', iban: '' },
    { name: 'KR Corporate Services \uc8fc\uc2dd\ud68c\uc0ac', address: '87 Teheran-ro, Gangnam-gu, Seoul', renewal_date: daysFromSeed(15), email: 'agents@krcorp.kr' },
    { customer: 'KB Kookmin Bank' },
  ),
  entity(
    IDS.ENTITY.BR_ITAU, 'Hopae Itau Brazil', 'Hopae Itau Ltda.', 'Ltda.', 'customer_entity',
    IDS.JURISDICTION.BR, HQ_ID, '2024-06-01', 'CNPJ 23.456.789/0001-01',
    'active',
    { bank_name: 'Itau Unibanco', account_number: 'BR97 0036 0305 0000 2000 9795 493P 1', currency: 'BRL', iban: 'BR97 0036 0305 0000 2000 9795 493P 1' },
    { name: 'Mattos Filho', address: 'Alameda Joaquim Eugenio de Lima, 447, Sao Paulo', renewal_date: daysFromSeed(15), email: 'agents@mattosfilho.com.br' },
    { customer: 'Itau Unibanco' },
  ),
  entity(
    IDS.ENTITY.CA_RBC, 'Hopae RBC Canada', 'Hopae RBC Inc.', 'Inc.', 'customer_entity',
    IDS.JURISDICTION.CA, HQ_ID, '2024-09-15', 'BC2345678',
    'active',
    { bank_name: 'Royal Bank of Canada', account_number: 'CA-003-23456-789', currency: 'CAD', iban: '' },
    { name: 'Torys LLP', address: '79 Wellington St W, Toronto, ON', renewal_date: daysFromSeed(15), email: 'agents@torys.ca' },
    { customer: 'Royal Bank of Canada' },
  ),
  entity(
    IDS.ENTITY.AU_CBA, 'Hopae CommBank Australia', 'Hopae CBA Pty Ltd', 'Pty Ltd', 'customer_entity',
    IDS.JURISDICTION.AU, HQ_ID, '2024-10-01', 'ACN 765 432 109',
    'active',
    { bank_name: 'Commonwealth Bank', account_number: 'AU-063-000-234567890', currency: 'AUD', iban: '' },
    { name: 'Herbert Smith Freehills', address: 'Level 34, 161 Castlereagh St, Sydney', renewal_date: daysFromSeed(15), email: 'agents@hsf.com.au' },
    { customer: 'Commonwealth Bank' },
  ),
  entity(
    IDS.ENTITY.PL_PKO, 'Hopae PKO Poland', 'Hopae PKO Sp. z o.o.', 'Sp. z o.o.', 'customer_entity',
    IDS.JURISDICTION.PL, HQ_ID, '2025-01-20', 'KRS 0001098765',
    'active',
    { bank_name: 'PKO Bank Polski', account_number: 'PL27 1140 2004 0000 3002 0135 5387', currency: 'PLN', iban: 'PL27 1140 2004 0000 3002 0135 5387' },
    { name: 'Wardynski & Partners', address: 'Al. Ujazdowskie 10, 00-478 Warsaw', renewal_date: daysFromSeed(15), email: 'agents@wardynski.pl' },
    { customer: 'PKO Bank Polski' },
  ),
  entity(
    IDS.ENTITY.FI_NORDEA, 'Hopae Nordea Finland', 'Hopae Nordea Oy', 'Oy', 'customer_entity',
    IDS.JURISDICTION.FI, HQ_ID, '2024-08-01', '4567890-2',
    'active',
    { bank_name: 'Nordea Finland', account_number: 'FI56 1234 5600 0008 96', currency: 'EUR', iban: 'FI56 1234 5600 0008 96' },
    { name: 'Fondia Oyj', address: 'Kaivokatu 10 A, 00100 Helsinki', renewal_date: daysFromSeed(15), email: 'agents@fondia.fi' },
    { customer: 'Nordea Finland' },
  ),
  entity(
    IDS.ENTITY.DK_DANSKE, 'Hopae Danske Denmark', 'Hopae Danske ApS', 'ApS', 'customer_entity',
    IDS.JURISDICTION.DK, HQ_ID, '2024-11-12', 'CVR 51234567',
    'active',
    { bank_name: 'Danske Bank', account_number: 'DK95 2000 0123 4567 89', currency: 'DKK', iban: 'DK95 2000 0123 4567 89' },
    { name: 'Kromann Reumert', address: 'Sundkrogsgade 5, 2100 Copenhagen', renewal_date: daysFromSeed(15), email: 'agents@kromann.dk' },
    { customer: 'Danske Bank' },
  ),

  // ---- Branch Entities (11) ----
  // Branches point to their SUBSIDIARY, not to HQ
  entity(
    IDS.ENTITY.DE_MUNICH_BRANCH, 'Hopae Germany Munich Branch', 'Hopae GmbH Zweigniederlassung Munchen', 'Branch', 'branch',
    IDS.JURISDICTION.DE, IDS.ENTITY.DE_PROVIDER, '2022-01-10', 'HRB 456789',
    'active',
    { bank_name: 'Deutsche Bank Munich', account_number: 'DE44 7001 0080 0123 4567 89', currency: 'EUR', iban: 'DE44 7001 0080 0123 4567 89' },
    { name: 'WM Corporate GmbH', address: 'Maximilianstr. 35, 80539 Munich', renewal_date: daysFromSeed(15), email: 'agents@wmcorp.de' },
    {},
  ),
  entity(
    IDS.ENTITY.FR_LYON_BRANCH, 'Hopae France Lyon Branch', 'Hopae S.A.S. Succursale Lyon', 'Branch', 'branch',
    IDS.JURISDICTION.FR, IDS.ENTITY.FR_PROVIDER, '2022-07-01', 'RCS Lyon B 845 456 789',
    'active',
    { bank_name: 'Credit Lyonnais', account_number: 'FR76 3000 6000 0412 3456 7890 189', currency: 'EUR', iban: 'FR76 3000 6000 0412 3456 7890 189' },
    { name: 'France Corporate Services S.A.S.', address: '20 Rue Garibaldi, 69006 Lyon', renewal_date: daysFromSeed(15), email: 'agents@frcorp.fr' },
    {},
  ),
  entity(
    IDS.ENTITY.SG_KL_BRANCH, 'Hopae Singapore Branch KL', 'Hopae Pte. Ltd. KL Branch', 'Branch', 'branch',
    IDS.JURISDICTION.SG, IDS.ENTITY.SG_PROVIDER, '2023-04-15', 'SSM-2023-KL-001',
    'active',
    { bank_name: 'DBS Bank', account_number: '003-934567-8', currency: 'SGD', iban: '' },
    { name: 'Boardroom Corporate & Advisory Services', address: '50 Raffles Place, Singapore 048623', renewal_date: daysFromSeed(15), email: 'agents@boardroom.sg' },
    {},
  ),
  entity(
    IDS.ENTITY.JP_OSAKA_BRANCH, 'Hopae Japan Osaka Branch', 'Hopae \u682a\u5f0f\u4f1a\u793e \u5927\u962a\u652f\u5e97', 'Branch', 'branch',
    IDS.JURISDICTION.JP, IDS.ENTITY.JP_PROVIDER, '2023-02-01', '0100-01-456789',
    'active',
    { bank_name: 'Resona Bank', account_number: '0010-456-7890123', currency: 'JPY', iban: '' },
    { name: 'Japan Corporate Agent K.K.', address: '1-8-17 Dojimahama, Kita-ku, Osaka', renewal_date: daysFromSeed(30), email: 'agents@jpcorp.jp' },
    {},
  ),
  entity(
    IDS.ENTITY.GB_EDINBURGH_BRANCH, 'Hopae UK Edinburgh Branch', 'Hopae Ltd. Edinburgh Branch', 'Branch', 'branch',
    IDS.JURISDICTION.GB, IDS.ENTITY.GB_PROVIDER, '2023-10-01', '14890123',
    'active',
    { bank_name: 'HSBC UK', account_number: 'GB15 HBUK 4012 3456 7890 12', currency: 'GBP', iban: 'GB15 HBUK 4012 3456 7890 12' },
    { name: 'TMF UK Ltd', address: '10 George Street, Edinburgh EH2 2PF', renewal_date: daysFromSeed(60), email: 'agents@tmf.co.uk' },
    {},
  ),
  entity(
    IDS.ENTITY.IN_BANGALORE_BRANCH, 'Hopae India Bangalore Branch', 'Hopae India Private Limited Bangalore', 'Branch', 'branch',
    IDS.JURISDICTION.IN, IDS.ENTITY.IN_PROVIDER, '2024-01-15', 'U72200KA2024PTC345678',
    'active',
    { bank_name: 'ICICI Bank', account_number: '60200034567890', currency: 'INR', iban: '' },
    { name: 'Legasis Partners Private Limited', address: 'Embassy Golf Links, Bangalore 560071', renewal_date: daysFromSeed(90), email: 'agents@legasis.in' },
    {},
  ),
  entity(
    IDS.ENTITY.KR_BUSAN_BRANCH, 'Hopae Korea Busan Branch', '\uc8fc\uc2dd\ud68c\uc0ac Hopae Korea \ubd80\uc0b0\uc9c0\uc810', 'Branch', 'branch',
    IDS.JURISDICTION.KR, IDS.ENTITY.KR_PROVIDER, '2024-06-20', '110111-9123456',
    'active',
    { bank_name: 'Busan Bank', account_number: 'KR-032-910678-01-001', currency: 'KRW', iban: '' },
    { name: 'KR Corporate Services \uc8fc\uc2dd\ud68c\uc0ac', address: '35 Jungang-daero, Jung-gu, Busan', renewal_date: daysFromSeed(15), email: 'agents@krcorp.kr' },
    {},
  ),
  entity(
    IDS.ENTITY.NL_ROTTERDAM_BRANCH, 'Hopae Netherlands Rotterdam Branch', 'Hopae B.V. Rotterdam Vestiging', 'Branch', 'branch',
    IDS.JURISDICTION.NL, IDS.ENTITY.NL_PROVIDER, '2024-03-10', 'KVK 10987654',
    'active',
    { bank_name: 'ING Bank', account_number: 'NL18 INGB 0001 2345 67', currency: 'EUR', iban: 'NL18 INGB 0001 2345 67' },
    { name: 'TMF Netherlands B.V.', address: 'Weena 200, 3012 NJ Rotterdam', renewal_date: daysFromSeed(15), email: 'agents@tmf.nl' },
    {},
  ),
  entity(
    IDS.ENTITY.SE_GOTEBORG_BRANCH, 'Hopae Sweden Gothenburg Branch', 'Hopae AB Goteborgskontor', 'Branch', 'branch',
    IDS.JURISDICTION.SE, IDS.ENTITY.SE_PROVIDER, '2024-07-01', '559456-7890',
    'active',
    { bank_name: 'SEB', account_number: 'SE56 5000 0000 0583 9825 8577', currency: 'SEK', iban: 'SE56 5000 0000 0583 9825 8577' },
    { name: 'Setterwalls Corporate Services AB', address: 'Ostra Hamngatan 16, 411 09 Gothenburg', renewal_date: daysFromSeed(15), email: 'agents@setterwalls.se' },
    {},
  ),
  entity(
    IDS.ENTITY.BE_GHENT_BRANCH, 'Hopae Belgium Ghent Branch', 'Hopae SRL Vestiging Gent', 'Branch', 'branch',
    IDS.JURISDICTION.BE, IDS.ENTITY.BE_PROVIDER, '2025-02-01', 'BE 0109.876.543',
    'dissolving',
    { bank_name: 'BNP Paribas Fortis', account_number: 'BE39 5390 0754 8145', currency: 'EUR', iban: 'BE39 5390 0754 8145' },
    { name: 'Linklaters LLP Brussels', address: 'Veldstraat 1, 9000 Gent', renewal_date: daysFromSeed(-40), email: 'agents@linklaters.be' },
    { dissolution_reason: 'Customer contract ended' },
  ),
  entity(
    IDS.ENTITY.EE_TALLINN_BRANCH, 'Hopae Estonia Branch', 'Hopae OU Tallinn Branch', 'Branch', 'branch',
    IDS.JURISDICTION.EE, IDS.ENTITY.EE_PROVIDER, '2025-03-01', '15678901',
    'dissolving',
    { bank_name: 'LHV Pank', account_number: 'EE38 2200 2210 2025 6789', currency: 'EUR', iban: 'EE38 2200 2210 2025 6789' },
    { name: 'Lelaw OU', address: 'Parnu mnt 15, 10141 Tallinn', renewal_date: daysFromSeed(-30), email: 'agents@lelaw.ee' },
    { dissolution_reason: 'Consolidation - operations moving to HQ entity' },
  ),
]

// ---------------------------------------------------------------------------
// Directors (~130 rows)
// ---------------------------------------------------------------------------

// Director ID format: c0000000-0000-0000-0000-000000000NNN
let directorCounter = 0
function dirId(): string {
  directorCounter++
  return `c0000000-0000-0000-0000-${String(directorCounter).padStart(12, '0')}`
}

function director(
  entity_id: string,
  full_name: string,
  role: string,
  nationality: string,
  start_date: string,
  is_current: boolean = true,
  end_date: string | null = null,
) {
  return {
    id: dirId(),
    entity_id,
    full_name,
    role,
    nationality,
    start_date,
    end_date,
    is_current,
  }
}

// Luxembourg HQ directors — these 3 recur as Luxembourg-appointed directors on subsidiaries
const LU_DIRECTORS = {
  FONTAINE: 'Jean-Luc Fontaine',
  KESSLER: 'Sophie Kessler',
  SCHILTZ: 'Marc Schiltz',
}

const DIRECTORS = [
  // ---- Luxembourg HQ (3 directors) ----
  director(IDS.ENTITY.LU_HQ, LU_DIRECTORS.FONTAINE, 'Gerant (CEO)', 'LU', '2019-03-15'),
  director(IDS.ENTITY.LU_HQ, LU_DIRECTORS.KESSLER, 'Gerant (CFO)', 'LU', '2019-03-15'),
  director(IDS.ENTITY.LU_HQ, LU_DIRECTORS.SCHILTZ, 'Gerant (Legal Counsel)', 'LU', '2020-01-10'),

  // ---- Provider Key Entities (23 x 2 = 46 directors) ----
  // Fontaine for entities 2-10, Kessler for 11-18, Schiltz for 19-24

  // DE - Fontaine rotation
  director(IDS.ENTITY.DE_PROVIDER, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2019-09-01'),
  director(IDS.ENTITY.DE_PROVIDER, 'Klaus Mueller', 'Geschaftsfuehrer', 'DE', '2019-09-01'),

  // FR - Fontaine rotation
  director(IDS.ENTITY.FR_PROVIDER, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2020-01-15'),
  director(IDS.ENTITY.FR_PROVIDER, 'Philippe Durand', 'President', 'FR', '2020-01-15'),

  // NL - Fontaine rotation
  director(IDS.ENTITY.NL_PROVIDER, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2020-03-20'),
  director(IDS.ENTITY.NL_PROVIDER, 'Jan van der Berg', 'Bestuurder', 'NL', '2020-03-20'),

  // EE - Fontaine rotation
  director(IDS.ENTITY.EE_PROVIDER, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2020-06-01'),
  director(IDS.ENTITY.EE_PROVIDER, 'Jaan Tamm', 'Juhatuse liige', 'EE', '2020-06-01'),

  // SE - Fontaine rotation
  director(IDS.ENTITY.SE_PROVIDER, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2020-09-10'),
  director(IDS.ENTITY.SE_PROVIDER, 'Erik Lindqvist', 'VD', 'SE', '2020-09-10'),

  // BE - Fontaine rotation
  director(IDS.ENTITY.BE_PROVIDER, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2021-01-25'),
  director(IDS.ENTITY.BE_PROVIDER, 'Pieter Vermeulen', 'Bestuurder', 'BE', '2021-01-25'),

  // SG - Fontaine rotation
  director(IDS.ENTITY.SG_PROVIDER, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2021-04-12'),
  director(IDS.ENTITY.SG_PROVIDER, 'Wei Ling Tan', 'Director', 'SG', '2021-04-12'),

  // JP - Fontaine rotation
  director(IDS.ENTITY.JP_PROVIDER, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2021-07-01'),
  director(IDS.ENTITY.JP_PROVIDER, 'Yamamoto Kenji', '\u4ee3\u8868\u53d6\u7de0\u5f79', 'JP', '2021-07-01'),

  // FI - Fontaine rotation
  director(IDS.ENTITY.FI_PROVIDER, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2021-10-14'),
  director(IDS.ENTITY.FI_PROVIDER, 'Mikko Virtanen', 'Toimitusjohtaja', 'FI', '2021-10-14'),

  // DK - Kessler rotation starts
  director(IDS.ENTITY.DK_PROVIDER, LU_DIRECTORS.KESSLER, 'Gerant', 'LU', '2022-02-01'),
  director(IDS.ENTITY.DK_PROVIDER, 'Lars Christensen', 'Direktor', 'DK', '2022-02-01'),

  // NO - Kessler rotation
  director(IDS.ENTITY.NO_PROVIDER, LU_DIRECTORS.KESSLER, 'Gerant', 'LU', '2022-04-22'),
  director(IDS.ENTITY.NO_PROVIDER, 'Anders Johansen', 'Daglig leder', 'NO', '2022-04-22'),

  // GB - Kessler rotation
  director(IDS.ENTITY.GB_PROVIDER, LU_DIRECTORS.KESSLER, 'Gerant', 'LU', '2022-07-05'),
  director(IDS.ENTITY.GB_PROVIDER, 'James Whitfield', 'Director', 'GB', '2022-07-05'),

  // IT - Kessler rotation
  director(IDS.ENTITY.IT_PROVIDER, LU_DIRECTORS.KESSLER, 'Gerant', 'LU', '2022-09-19'),
  director(IDS.ENTITY.IT_PROVIDER, 'Marco Rossi', 'Amministratore', 'IT', '2022-09-19'),

  // ES - Kessler rotation
  director(IDS.ENTITY.ES_PROVIDER, LU_DIRECTORS.KESSLER, 'Gerant', 'LU', '2022-11-03'),
  director(IDS.ENTITY.ES_PROVIDER, 'Carlos Garcia Lopez', 'Administrador', 'ES', '2022-11-03'),

  // AT - Kessler rotation
  director(IDS.ENTITY.AT_PROVIDER, LU_DIRECTORS.KESSLER, 'Gerant', 'LU', '2023-01-20'),
  director(IDS.ENTITY.AT_PROVIDER, 'Thomas Hofer', 'Geschaftsfuehrer', 'AT', '2023-01-20'),

  // IN - Kessler rotation
  director(IDS.ENTITY.IN_PROVIDER, LU_DIRECTORS.KESSLER, 'Gerant', 'LU', '2023-03-31'),
  director(IDS.ENTITY.IN_PROVIDER, 'Rajiv Sharma', 'Director', 'IN', '2023-03-31'),

  // AE - Kessler rotation
  director(IDS.ENTITY.AE_PROVIDER, LU_DIRECTORS.KESSLER, 'Gerant', 'LU', '2023-06-15'),
  director(IDS.ENTITY.AE_PROVIDER, 'Mohammed Al-Rashidi', 'Manager', 'AE', '2023-06-15'),

  // KR - Schiltz rotation starts
  director(IDS.ENTITY.KR_PROVIDER, LU_DIRECTORS.SCHILTZ, 'Gerant', 'LU', '2023-09-01'),
  director(IDS.ENTITY.KR_PROVIDER, 'Kim Jiyeon', '\ub300\ud45c\uc774\uc0ac', 'KR', '2023-09-01'),

  // BR - Schiltz rotation
  director(IDS.ENTITY.BR_PROVIDER, LU_DIRECTORS.SCHILTZ, 'Gerant', 'LU', '2024-01-10'),
  director(IDS.ENTITY.BR_PROVIDER, 'Ricardo Santos Silva', 'Diretor', 'BR', '2024-01-10'),

  // CA - Schiltz rotation
  director(IDS.ENTITY.CA_PROVIDER, LU_DIRECTORS.SCHILTZ, 'Gerant', 'LU', '2024-04-01'),
  director(IDS.ENTITY.CA_PROVIDER, 'David Thompson', 'Director', 'CA', '2024-04-01'),

  // AU - Schiltz rotation
  director(IDS.ENTITY.AU_PROVIDER, LU_DIRECTORS.SCHILTZ, 'Gerant', 'LU', '2024-07-22'),
  director(IDS.ENTITY.AU_PROVIDER, 'Sarah Mitchell', 'Director', 'AU', '2024-07-22'),

  // PL - Schiltz rotation
  director(IDS.ENTITY.PL_PROVIDER, LU_DIRECTORS.SCHILTZ, 'Gerant', 'LU', '2024-10-15'),
  director(IDS.ENTITY.PL_PROVIDER, 'Krzysztof Nowak', 'Prezes Zarzadu', 'PL', '2024-10-15'),

  // AE Abu Dhabi - Schiltz rotation
  director(IDS.ENTITY.AE_ABU_DHABI, LU_DIRECTORS.SCHILTZ, 'Gerant', 'LU', '2025-01-20'),
  director(IDS.ENTITY.AE_ABU_DHABI, 'Ahmed Al-Mansoori', 'Manager', 'AE', '2025-01-20'),

  // ---- Customer Entities (28 x 2 = 56 directors) ----
  // Fontaine for entities 25-34, Kessler for 35-42, Schiltz for 43-52

  // DE_NORDENBANK - Fontaine rotation
  director(IDS.ENTITY.DE_NORDENBANK, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2021-11-15'),
  director(IDS.ENTITY.DE_NORDENBANK, 'Anna Schneider', 'Geschaftsfuehrerin', 'DE', '2021-11-15'),

  // DE_BERLINER - Fontaine rotation
  director(IDS.ENTITY.DE_BERLINER, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2022-03-01'),
  director(IDS.ENTITY.DE_BERLINER, 'Markus Weber', 'Geschaftsfuehrer', 'DE', '2022-03-01'),

  // FR_SGC - Fontaine rotation
  director(IDS.ENTITY.FR_SGC, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2022-05-12'),
  director(IDS.ENTITY.FR_SGC, 'Claire Martin', 'Directeur General', 'FR', '2022-05-12'),

  // FR_ING - Fontaine rotation
  director(IDS.ENTITY.FR_ING, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2022-08-20'),
  director(IDS.ENTITY.FR_ING, 'Jean-Pierre Lefevre', 'President', 'FR', '2022-08-20'),

  // NL_RABOBANK - Fontaine rotation
  director(IDS.ENTITY.NL_RABOBANK, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2022-06-01'),
  director(IDS.ENTITY.NL_RABOBANK, 'Anja de Vries', 'Directeur', 'NL', '2022-06-01'),

  // NL_ABN - Fontaine rotation
  director(IDS.ENTITY.NL_ABN, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2022-11-10'),
  director(IDS.ENTITY.NL_ABN, 'Hendrik Bakker', 'Bestuurder', 'NL', '2022-11-10'),

  // SE_SWEDBANK - Fontaine rotation
  director(IDS.ENTITY.SE_SWEDBANK, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2022-12-01'),
  director(IDS.ENTITY.SE_SWEDBANK, 'Anna Bergstrom', 'VD', 'SE', '2022-12-01'),

  // SE_HANDELS - Fontaine rotation
  director(IDS.ENTITY.SE_HANDELS, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2023-02-14'),
  director(IDS.ENTITY.SE_HANDELS, 'Gustav Eriksson', 'VD', 'SE', '2023-02-14'),

  // BE_KBC - Fontaine rotation
  director(IDS.ENTITY.BE_KBC, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2023-04-01'),
  director(IDS.ENTITY.BE_KBC, 'Luc Janssens', 'Bestuurder', 'BE', '2023-04-01'),

  // BE_BELFIUS - Fontaine rotation
  director(IDS.ENTITY.BE_BELFIUS, LU_DIRECTORS.FONTAINE, 'Gerant', 'LU', '2023-06-20'),
  director(IDS.ENTITY.BE_BELFIUS, 'Marie Dupont', 'Bestuurder', 'BE', '2023-06-20'),

  // SG_DBS - Kessler rotation starts
  director(IDS.ENTITY.SG_DBS, LU_DIRECTORS.KESSLER, 'Gerant', 'LU', '2022-10-05'),
  director(IDS.ENTITY.SG_DBS, 'Rajesh Kumar', 'Director', 'SG', '2022-10-05'),

  // SG_OCBC - Kessler rotation
  director(IDS.ENTITY.SG_OCBC, LU_DIRECTORS.KESSLER, 'Gerant', 'LU', '2023-01-15'),
  director(IDS.ENTITY.SG_OCBC, 'Li Wei Chen', 'Director', 'SG', '2023-01-15'),

  // JP_SMBC - Kessler rotation
  director(IDS.ENTITY.JP_SMBC, LU_DIRECTORS.KESSLER, 'Gerant', 'LU', '2022-09-01'),
  director(IDS.ENTITY.JP_SMBC, 'Tanaka Hiroshi', '\u4ee3\u8868\u53d6\u7de0\u5f79', 'JP', '2022-09-01'),

  // JP_MUFG - Kessler rotation
  director(IDS.ENTITY.JP_MUFG, LU_DIRECTORS.KESSLER, 'Gerant', 'LU', '2023-03-20'),
  director(IDS.ENTITY.JP_MUFG, 'Suzuki Yoko', '\u53d6\u7de0\u5f79', 'JP', '2023-03-20'),

  // GB_LLOYDS - Kessler rotation
  director(IDS.ENTITY.GB_LLOYDS, LU_DIRECTORS.KESSLER, 'Gerant', 'LU', '2023-05-01'),
  director(IDS.ENTITY.GB_LLOYDS, 'Emma Pemberton', 'Director', 'GB', '2023-05-01'),

  // GB_NATWEST - Kessler rotation
  director(IDS.ENTITY.GB_NATWEST, LU_DIRECTORS.KESSLER, 'Gerant', 'LU', '2023-08-12'),
  director(IDS.ENTITY.GB_NATWEST, 'William Hargreaves', 'Director', 'GB', '2023-08-12'),

  // IT_INTESA - Kessler rotation
  director(IDS.ENTITY.IT_INTESA, LU_DIRECTORS.KESSLER, 'Gerant', 'LU', '2023-07-25'),
  director(IDS.ENTITY.IT_INTESA, 'Giulia Bianchi', 'Amministratore', 'IT', '2023-07-25'),

  // ES_CAIXA - Kessler rotation
  director(IDS.ENTITY.ES_CAIXA, LU_DIRECTORS.KESSLER, 'Gerant', 'LU', '2023-09-10'),
  director(IDS.ENTITY.ES_CAIXA, 'Maria Fernandez Ruiz', 'Administrador', 'ES', '2023-09-10'),

  // AT_BAWAG - Schiltz rotation starts
  director(IDS.ENTITY.AT_BAWAG, LU_DIRECTORS.SCHILTZ, 'Gerant', 'LU', '2023-11-01'),
  director(IDS.ENTITY.AT_BAWAG, 'Sabine Gruber', 'Geschaftsfuehrerin', 'AT', '2023-11-01'),

  // IN_HDFC - Schiltz rotation
  director(IDS.ENTITY.IN_HDFC, LU_DIRECTORS.SCHILTZ, 'Gerant', 'LU', '2024-02-15'),
  director(IDS.ENTITY.IN_HDFC, 'Priya Nair', 'Director', 'IN', '2024-02-15'),

  // AE_EMIRATES - Schiltz rotation
  director(IDS.ENTITY.AE_EMIRATES, LU_DIRECTORS.SCHILTZ, 'Gerant', 'LU', '2024-03-22'),
  director(IDS.ENTITY.AE_EMIRATES, 'Sarah Al-Mansoori', 'Manager', 'AE', '2024-03-22'),

  // KR_KB - Schiltz rotation
  director(IDS.ENTITY.KR_KB, LU_DIRECTORS.SCHILTZ, 'Gerant', 'LU', '2024-05-10'),
  director(IDS.ENTITY.KR_KB, 'Park Seojun', '\ub300\ud45c\uc774\uc0ac', 'KR', '2024-05-10'),

  // BR_ITAU - Schiltz rotation
  director(IDS.ENTITY.BR_ITAU, LU_DIRECTORS.SCHILTZ, 'Gerant', 'LU', '2024-06-01'),
  director(IDS.ENTITY.BR_ITAU, 'Ana Oliveira Costa', 'Diretor', 'BR', '2024-06-01'),

  // CA_RBC - Schiltz rotation
  director(IDS.ENTITY.CA_RBC, LU_DIRECTORS.SCHILTZ, 'Gerant', 'LU', '2024-09-15'),
  director(IDS.ENTITY.CA_RBC, 'Michael Chen', 'Director', 'CA', '2024-09-15'),

  // AU_CBA - Schiltz rotation
  director(IDS.ENTITY.AU_CBA, LU_DIRECTORS.SCHILTZ, 'Gerant', 'LU', '2024-10-01'),
  director(IDS.ENTITY.AU_CBA, 'Jennifer O\'Brien', 'Director', 'AU', '2024-10-01'),

  // PL_PKO - Schiltz rotation
  director(IDS.ENTITY.PL_PKO, LU_DIRECTORS.SCHILTZ, 'Gerant', 'LU', '2025-01-20'),
  director(IDS.ENTITY.PL_PKO, 'Agnieszka Kowalska', 'Prezes Zarzadu', 'PL', '2025-01-20'),

  // FI_NORDEA - Schiltz rotation
  director(IDS.ENTITY.FI_NORDEA, LU_DIRECTORS.SCHILTZ, 'Gerant', 'LU', '2024-08-01'),
  director(IDS.ENTITY.FI_NORDEA, 'Antti Korhonen', 'Toimitusjohtaja', 'FI', '2024-08-01'),

  // DK_DANSKE - Schiltz rotation
  director(IDS.ENTITY.DK_DANSKE, LU_DIRECTORS.SCHILTZ, 'Gerant', 'LU', '2024-11-12'),
  director(IDS.ENTITY.DK_DANSKE, 'Mette Sorensen', 'Direktor', 'DK', '2024-11-12'),

  // ---- Branch Entities (11 x 1 = 11 directors) ----
  // Branches have 1 local branch manager only

  director(IDS.ENTITY.DE_MUNICH_BRANCH, 'Stefan Bauer', 'Branch Manager', 'DE', '2022-01-10'),
  director(IDS.ENTITY.FR_LYON_BRANCH, 'Laurent Moreau', 'Branch Manager', 'FR', '2022-07-01'),
  director(IDS.ENTITY.SG_KL_BRANCH, 'Ahmad bin Ibrahim', 'Branch Manager', 'MY', '2023-04-15'),
  director(IDS.ENTITY.JP_OSAKA_BRANCH, 'Sato Akiko', 'Branch Manager', 'JP', '2023-02-01'),
  director(IDS.ENTITY.GB_EDINBURGH_BRANCH, 'Fiona MacLeod', 'Branch Manager', 'GB', '2023-10-01'),
  director(IDS.ENTITY.IN_BANGALORE_BRANCH, 'Vikram Desai', 'Branch Manager', 'IN', '2024-01-15'),
  director(IDS.ENTITY.KR_BUSAN_BRANCH, 'Lee Minjun', 'Branch Manager', 'KR', '2024-06-20'),
  director(IDS.ENTITY.NL_ROTTERDAM_BRANCH, 'Daan Visser', 'Branch Manager', 'NL', '2024-03-10'),
  director(IDS.ENTITY.SE_GOTEBORG_BRANCH, 'Karin Johansson', 'Branch Manager', 'SE', '2024-07-01'),

  // Dissolving branches — local director has end_date and is_current = false
  director(IDS.ENTITY.BE_GHENT_BRANCH, 'Sofie De Smedt', 'Branch Manager', 'BE', '2025-02-01', false, '2026-02-28'),
  director(IDS.ENTITY.EE_TALLINN_BRANCH, 'Kristiina Kaljurand', 'Branch Manager', 'EE', '2025-03-01', false, '2026-02-28'),
]

// ---------------------------------------------------------------------------
// Compliance Requirements (~170 rows)
// ---------------------------------------------------------------------------

// Compliance requirement ID format: d0000000-0000-0000-0000-000000000NNN
let crCounter = 0
function crId(): string {
  crCounter++
  return `d0000000-0000-0000-0000-${String(crCounter).padStart(12, '0')}`
}

function complianceReq(
  entity_id: string,
  requirement_type: string,
  due_date: string,
  fiscal_year: number | null,
  status: 'pending' | 'in_progress' | 'completed' | 'overdue',
  notes: string,
  completed_at: string | null = null,
) {
  return {
    id: crId(),
    entity_id,
    requirement_type,
    due_date,
    fiscal_year,
    status,
    notes,
    completed_at,
  }
}

const COMPLIANCE_REQUIREMENTS = [
  // =========================================================================
  // OVERDUE ITEMS (3) — These drive the dashboard's dramatic tension
  // =========================================================================

  // Brazil annual filing — 41 days overdue
  complianceReq(
    IDS.ENTITY.BR_PROVIDER, 'annual_filing', '2026-01-31', 2025, 'overdue',
    'Annual financial statements for FY2025 - Brazil DNRC filing. 41 days overdue.'
  ),
  // Poland annual filing — 13 days overdue
  complianceReq(
    IDS.ENTITY.PL_PROVIDER, 'annual_filing', '2026-02-28', 2025, 'overdue',
    'FY2025 annual accounts overdue. 13 days overdue.'
  ),
  // Belgium Ghent Branch agent renewal — dissolving, lapsed
  complianceReq(
    IDS.ENTITY.BE_GHENT_BRANCH, 'agent_renewal', '2026-02-01', 2025, 'overdue',
    'Registered agent renewal lapsed. Branch dissolving.'
  ),

  // =========================================================================
  // DUE-SOON ITEMS (5+) — pending, due within 30 days of 2026-03-13
  // =========================================================================

  // Korea provider — tax return due Mar 31 (18 days)
  complianceReq(
    IDS.ENTITY.KR_PROVIDER, 'tax_return', '2026-03-31', 2025, 'pending',
    'FY2025 corporate income tax return due. 18 days remaining.'
  ),
  // Poland provider — tax return due Mar 31 (18 days)
  complianceReq(
    IDS.ENTITY.PL_PROVIDER, 'tax_return', '2026-03-31', 2025, 'pending',
    'FY2025 CIT return due. 18 days remaining.'
  ),
  // India provider — annual filing due Mar 31 (18 days, India FYE Mar 31)
  complianceReq(
    IDS.ENTITY.IN_PROVIDER, 'annual_filing', '2026-03-31', 2025, 'pending',
    'Annual filing for FY2025-26 due (India FYE Mar 31). 18 days remaining.'
  ),
  // Finland provider — tax return due Apr 10 (28 days)
  complianceReq(
    IDS.ENTITY.FI_PROVIDER, 'tax_return', '2026-04-10', 2025, 'pending',
    'FY2025 CIT return due 4 months after FYE. 28 days remaining.'
  ),
  // Korea KB customer — tax return due Mar 31 (18 days)
  complianceReq(
    IDS.ENTITY.KR_KB, 'tax_return', '2026-03-31', 2025, 'pending',
    'FY2025 corporate income tax return due. 18 days remaining.'
  ),

  // =========================================================================
  // HEALTHY ITEMS — realistic portfolio of pending and completed requirements
  // =========================================================================

  // --- Luxembourg HQ ---
  complianceReq(IDS.ENTITY.LU_HQ, 'annual_filing', '2026-07-31', 2025, 'pending',
    'Annual accounts due 7 months after FYE per RCS.'),
  complianceReq(IDS.ENTITY.LU_HQ, 'tax_return', '2026-12-31', 2025, 'pending',
    'CIT return due Dec 31 following FYE.'),
  complianceReq(IDS.ENTITY.LU_HQ, 'annual_filing', '2025-07-31', 2024, 'completed',
    'FY2024 annual accounts filed on time.', '2025-07-15T00:00:00Z'),

  // --- Germany Provider ---
  complianceReq(IDS.ENTITY.DE_PROVIDER, 'annual_filing', '2026-12-31', 2025, 'pending',
    'GmbH annual accounts due 12 months after FYE.'),
  complianceReq(IDS.ENTITY.DE_PROVIDER, 'tax_return', '2026-07-31', 2025, 'pending',
    'CIT return due Jul 31.'),
  complianceReq(IDS.ENTITY.DE_PROVIDER, 'annual_filing', '2025-12-31', 2024, 'completed',
    'FY2024 annual accounts filed.', '2025-12-01T00:00:00Z'),

  // --- France Provider ---
  complianceReq(IDS.ENTITY.FR_PROVIDER, 'annual_filing', '2026-06-30', 2025, 'pending',
    'S.A.S. annual accounts due 6 months after FYE.'),
  complianceReq(IDS.ENTITY.FR_PROVIDER, 'tax_return', '2026-05-31', 2025, 'pending',
    'CIT return due end of May.'),

  // --- Netherlands Provider ---
  complianceReq(IDS.ENTITY.NL_PROVIDER, 'annual_filing', '2026-05-31', 2025, 'pending',
    'B.V. annual accounts due 5 months after FYE.'),
  complianceReq(IDS.ENTITY.NL_PROVIDER, 'tax_return', '2026-05-31', 2025, 'pending',
    'CIT return due May 31.'),

  // --- Estonia Provider ---
  complianceReq(IDS.ENTITY.EE_PROVIDER, 'annual_filing', '2026-06-30', 2025, 'pending',
    'OU annual accounts due 6 months after FYE.'),

  // --- Sweden Provider ---
  complianceReq(IDS.ENTITY.SE_PROVIDER, 'annual_filing', '2026-07-01', 2025, 'pending',
    'AB annual accounts and CIT return due Jul 1.'),
  complianceReq(IDS.ENTITY.SE_PROVIDER, 'tax_return', '2026-07-01', 2025, 'pending',
    'CIT return due Jul 1.'),

  // --- Belgium Provider ---
  complianceReq(IDS.ENTITY.BE_PROVIDER, 'annual_filing', '2026-07-31', 2025, 'pending',
    'SRL annual accounts due 7 months after FYE.'),
  complianceReq(IDS.ENTITY.BE_PROVIDER, 'tax_return', '2026-09-30', 2025, 'pending',
    'CIT return due Sep 30.'),

  // --- Singapore Provider ---
  complianceReq(IDS.ENTITY.SG_PROVIDER, 'annual_filing', '2026-11-30', 2025, 'pending',
    'Pte. Ltd. annual return due Nov 30.'),
  complianceReq(IDS.ENTITY.SG_PROVIDER, 'annual_filing', '2025-11-30', 2024, 'completed',
    'FY2024 annual return filed.', '2025-11-20T00:00:00Z'),

  // --- Japan Provider ---
  complianceReq(IDS.ENTITY.JP_PROVIDER, 'annual_filing', '2026-05-31', 2025, 'pending',
    'KK annual accounts due 2 months after Mar 31 FYE.'),
  complianceReq(IDS.ENTITY.JP_PROVIDER, 'tax_return', '2026-05-31', 2025, 'pending',
    'CIT return due 2 months after FYE.'),

  // --- Finland Provider (already has due-soon tax_return above) ---
  complianceReq(IDS.ENTITY.FI_PROVIDER, 'annual_filing', '2026-04-30', 2025, 'pending',
    'Oy annual accounts due 4 months after FYE.'),

  // --- Denmark Provider ---
  complianceReq(IDS.ENTITY.DK_PROVIDER, 'annual_filing', '2026-06-30', 2025, 'pending',
    'ApS annual accounts due 6 months after FYE.'),
  complianceReq(IDS.ENTITY.DK_PROVIDER, 'tax_return', '2026-06-30', 2025, 'pending',
    'CIT return due Jun 30.'),

  // --- Norway Provider ---
  complianceReq(IDS.ENTITY.NO_PROVIDER, 'annual_filing', '2026-06-30', 2025, 'pending',
    'AS annual accounts due 6 months after FYE.'),
  complianceReq(IDS.ENTITY.NO_PROVIDER, 'tax_return', '2026-05-31', 2025, 'pending',
    'Tax return due end of May.'),

  // --- UK Provider ---
  complianceReq(IDS.ENTITY.GB_PROVIDER, 'annual_filing', '2026-09-30', 2025, 'pending',
    'Ltd. annual accounts due 9 months after FYE.'),
  complianceReq(IDS.ENTITY.GB_PROVIDER, 'tax_return', '2026-12-31', 2025, 'pending',
    'Corporation tax due 12 months after FYE.'),

  // --- Italy Provider ---
  complianceReq(IDS.ENTITY.IT_PROVIDER, 'annual_filing', '2026-04-30', 2025, 'pending',
    'S.r.l. annual accounts due 4 months after FYE.'),
  complianceReq(IDS.ENTITY.IT_PROVIDER, 'tax_return', '2026-10-31', 2025, 'pending',
    'CIT due Oct 31.'),

  // --- Spain Provider ---
  complianceReq(IDS.ENTITY.ES_PROVIDER, 'annual_filing', '2026-06-30', 2025, 'pending',
    'S.L. annual accounts due 6 months after FYE.'),
  complianceReq(IDS.ENTITY.ES_PROVIDER, 'tax_return', '2026-07-25', 2025, 'pending',
    'CIT due Jul 25.'),

  // --- Austria Provider ---
  complianceReq(IDS.ENTITY.AT_PROVIDER, 'annual_filing', '2026-09-30', 2025, 'pending',
    'GmbH annual accounts due 9 months after FYE.'),
  complianceReq(IDS.ENTITY.AT_PROVIDER, 'tax_return', '2026-06-30', 2025, 'pending',
    'CIT due Jun 30.'),

  // --- India Provider (already has due-soon annual_filing above) ---
  complianceReq(IDS.ENTITY.IN_PROVIDER, 'tax_return', '2026-10-31', 2025, 'pending',
    'CIT due Oct 31.'),

  // --- UAE Provider ---
  complianceReq(IDS.ENTITY.AE_PROVIDER, 'annual_filing', '2026-09-30', 2025, 'pending',
    'DIFC LLC annual return due 9 months after FYE.'),
  complianceReq(IDS.ENTITY.AE_PROVIDER, 'tax_return', '2026-09-30', 2025, 'pending',
    'CIT due Sep 30.'),

  // --- Korea Provider (already has due-soon tax_return above) ---
  complianceReq(IDS.ENTITY.KR_PROVIDER, 'annual_filing', '2026-03-31', 2025, 'pending',
    'Annual accounts due 3 months after FYE.'),

  // --- Brazil Provider (already has overdue annual_filing above) ---
  complianceReq(IDS.ENTITY.BR_PROVIDER, 'tax_return', '2026-07-31', 2025, 'pending',
    'CIT due Jul 31.'),

  // --- Canada Provider ---
  complianceReq(IDS.ENTITY.CA_PROVIDER, 'annual_filing', '2026-06-30', 2025, 'pending',
    'Inc. annual return due 6 months after FYE.'),
  complianceReq(IDS.ENTITY.CA_PROVIDER, 'tax_return', '2026-06-30', 2025, 'pending',
    'CIT due Jun 30.'),

  // --- Australia Provider ---
  complianceReq(IDS.ENTITY.AU_PROVIDER, 'annual_filing', '2026-11-30', 2025, 'pending',
    'Pty Ltd annual accounts due Nov 30 (5 months after Jun 30 FYE).'),
  complianceReq(IDS.ENTITY.AU_PROVIDER, 'tax_return', '2027-01-15', 2025, 'pending',
    'Tax return due Jan 15 following FYE.'),

  // --- Poland Provider (already has overdue annual_filing and due-soon tax_return) ---
  // No additional needed

  // --- UAE Abu Dhabi ---
  complianceReq(IDS.ENTITY.AE_ABU_DHABI, 'annual_filing', '2026-09-30', 2025, 'pending',
    'ADGM annual return due 9 months after FYE.'),

  // =========================================================================
  // CUSTOMER ENTITIES — 1-2 requirements each (annual_filing + tax_return)
  // =========================================================================

  // DE customers
  complianceReq(IDS.ENTITY.DE_NORDENBANK, 'annual_filing', '2026-12-31', 2025, 'pending',
    'GmbH annual accounts due 12 months after FYE.'),
  complianceReq(IDS.ENTITY.DE_NORDENBANK, 'tax_return', '2026-07-31', 2025, 'pending',
    'CIT return due Jul 31.'),
  complianceReq(IDS.ENTITY.DE_BERLINER, 'annual_filing', '2026-12-31', 2025, 'pending',
    'GmbH annual accounts due 12 months after FYE.'),
  complianceReq(IDS.ENTITY.DE_BERLINER, 'tax_return', '2026-07-31', 2025, 'pending',
    'CIT return due Jul 31.'),

  // FR customers
  complianceReq(IDS.ENTITY.FR_SGC, 'annual_filing', '2026-06-30', 2025, 'pending',
    'S.A.S. annual accounts due 6 months after FYE.'),
  complianceReq(IDS.ENTITY.FR_ING, 'annual_filing', '2026-06-30', 2025, 'pending',
    'S.A.S. annual accounts due 6 months after FYE.'),

  // NL customers
  complianceReq(IDS.ENTITY.NL_RABOBANK, 'annual_filing', '2026-05-31', 2025, 'pending',
    'B.V. annual accounts due 5 months after FYE.'),
  complianceReq(IDS.ENTITY.NL_ABN, 'annual_filing', '2026-05-31', 2025, 'pending',
    'B.V. annual accounts due 5 months after FYE.'),

  // SE customers
  complianceReq(IDS.ENTITY.SE_SWEDBANK, 'annual_filing', '2026-07-01', 2025, 'pending',
    'AB annual accounts due Jul 1.'),
  complianceReq(IDS.ENTITY.SE_HANDELS, 'annual_filing', '2026-07-01', 2025, 'pending',
    'AB annual accounts due Jul 1.'),

  // BE customers
  complianceReq(IDS.ENTITY.BE_KBC, 'annual_filing', '2026-07-31', 2025, 'pending',
    'SRL annual accounts due 7 months after FYE.'),
  complianceReq(IDS.ENTITY.BE_BELFIUS, 'annual_filing', '2026-07-31', 2025, 'pending',
    'SRL annual accounts due 7 months after FYE.'),

  // SG customers
  complianceReq(IDS.ENTITY.SG_DBS, 'annual_filing', '2026-11-30', 2025, 'pending',
    'Pte. Ltd. annual return due Nov 30.'),
  complianceReq(IDS.ENTITY.SG_OCBC, 'annual_filing', '2026-11-30', 2025, 'pending',
    'Pte. Ltd. annual return due Nov 30.'),

  // JP customers
  complianceReq(IDS.ENTITY.JP_SMBC, 'annual_filing', '2026-05-31', 2025, 'pending',
    'KK annual accounts due 2 months after Mar 31 FYE.'),
  complianceReq(IDS.ENTITY.JP_MUFG, 'annual_filing', '2026-05-31', 2025, 'pending',
    'KK annual accounts due 2 months after Mar 31 FYE.'),

  // GB customers
  complianceReq(IDS.ENTITY.GB_LLOYDS, 'annual_filing', '2026-09-30', 2025, 'pending',
    'Ltd. annual accounts due 9 months after FYE.'),
  complianceReq(IDS.ENTITY.GB_NATWEST, 'annual_filing', '2026-09-30', 2025, 'pending',
    'Ltd. annual accounts due 9 months after FYE.'),

  // IT customer
  complianceReq(IDS.ENTITY.IT_INTESA, 'annual_filing', '2026-04-30', 2025, 'pending',
    'S.r.l. annual accounts due 4 months after FYE.'),

  // ES customer
  complianceReq(IDS.ENTITY.ES_CAIXA, 'annual_filing', '2026-06-30', 2025, 'pending',
    'S.L. annual accounts due 6 months after FYE.'),

  // AT customer
  complianceReq(IDS.ENTITY.AT_BAWAG, 'annual_filing', '2026-09-30', 2025, 'pending',
    'GmbH annual accounts due 9 months after FYE.'),

  // IN customer
  complianceReq(IDS.ENTITY.IN_HDFC, 'annual_filing', '2026-03-31', 2025, 'pending',
    'Annual filing for FY2025-26 due (India FYE Mar 31).'),

  // AE customer
  complianceReq(IDS.ENTITY.AE_EMIRATES, 'annual_filing', '2026-09-30', 2025, 'pending',
    'LLC annual return due 9 months after FYE.'),

  // KR customer (already has due-soon tax_return above)
  complianceReq(IDS.ENTITY.KR_KB, 'annual_filing', '2026-03-31', 2025, 'pending',
    'Annual accounts due 3 months after FYE.'),

  // BR customer
  complianceReq(IDS.ENTITY.BR_ITAU, 'annual_filing', '2026-07-31', 2025, 'pending',
    'Ltda. annual financial statements due last working day of Jul.'),

  // CA customer
  complianceReq(IDS.ENTITY.CA_RBC, 'annual_filing', '2026-06-30', 2025, 'pending',
    'Inc. annual return due 6 months after FYE.'),

  // AU customer
  complianceReq(IDS.ENTITY.AU_CBA, 'annual_filing', '2026-11-30', 2025, 'pending',
    'Pty Ltd annual accounts due Nov 30.'),

  // PL customer
  complianceReq(IDS.ENTITY.PL_PKO, 'annual_filing', '2026-03-31', 2025, 'pending',
    'Sp. z o.o. annual accounts due 3 months after FYE.'),

  // FI customer
  complianceReq(IDS.ENTITY.FI_NORDEA, 'annual_filing', '2026-04-30', 2025, 'pending',
    'Oy annual accounts due 4 months after FYE.'),

  // DK customer
  complianceReq(IDS.ENTITY.DK_DANSKE, 'annual_filing', '2026-06-30', 2025, 'pending',
    'ApS annual accounts due 6 months after FYE.'),

  // NO Provider extra completed item
  complianceReq(IDS.ENTITY.NO_PROVIDER, 'annual_filing', '2025-06-30', 2024, 'completed',
    'FY2024 AS annual accounts filed.', '2025-06-15T00:00:00Z'),

  // =========================================================================
  // BRANCH ENTITIES — 1 requirement each (agent_renewal or annual_filing)
  // =========================================================================

  complianceReq(IDS.ENTITY.DE_MUNICH_BRANCH, 'agent_renewal', '2026-03-31', null, 'pending',
    'Registered agent renewal for Munich branch.'),
  complianceReq(IDS.ENTITY.FR_LYON_BRANCH, 'agent_renewal', '2026-03-31', null, 'pending',
    'Registered agent renewal for Lyon branch.'),
  complianceReq(IDS.ENTITY.SG_KL_BRANCH, 'agent_renewal', '2026-04-30', null, 'pending',
    'Registered agent renewal for KL branch.'),
  complianceReq(IDS.ENTITY.JP_OSAKA_BRANCH, 'agent_renewal', '2026-04-30', null, 'pending',
    'Registered agent renewal for Osaka branch.'),
  complianceReq(IDS.ENTITY.GB_EDINBURGH_BRANCH, 'agent_renewal', '2026-05-31', null, 'pending',
    'Registered agent renewal for Edinburgh branch.'),
  complianceReq(IDS.ENTITY.IN_BANGALORE_BRANCH, 'agent_renewal', '2026-06-30', null, 'pending',
    'Registered agent renewal for Bangalore branch.'),
  complianceReq(IDS.ENTITY.KR_BUSAN_BRANCH, 'agent_renewal', '2026-02-28', null, 'pending',
    'Registered agent renewal for Busan branch.'),
  complianceReq(IDS.ENTITY.NL_ROTTERDAM_BRANCH, 'agent_renewal', '2026-03-31', null, 'pending',
    'Registered agent renewal for Rotterdam branch.'),
  complianceReq(IDS.ENTITY.SE_GOTEBORG_BRANCH, 'agent_renewal', '2026-02-28', null, 'pending',
    'Registered agent renewal for Gothenburg branch.'),
  // Dissolving: Estonia branch
  complianceReq(IDS.ENTITY.EE_TALLINN_BRANCH, 'agent_renewal', '2026-03-31', null, 'pending',
    'Registered agent renewal — branch winding down.'),

  // =========================================================================
  // Additional completed FY2024 items for realism
  // =========================================================================

  complianceReq(IDS.ENTITY.DE_PROVIDER, 'tax_return', '2025-07-31', 2024, 'completed',
    'FY2024 CIT return filed.', '2025-07-20T00:00:00Z'),
  complianceReq(IDS.ENTITY.FR_PROVIDER, 'annual_filing', '2025-06-30', 2024, 'completed',
    'FY2024 annual accounts filed.', '2025-06-25T00:00:00Z'),
  complianceReq(IDS.ENTITY.NL_PROVIDER, 'annual_filing', '2025-05-31', 2024, 'completed',
    'FY2024 annual accounts filed.', '2025-05-20T00:00:00Z'),
  complianceReq(IDS.ENTITY.SE_PROVIDER, 'annual_filing', '2025-07-01', 2024, 'completed',
    'FY2024 AB annual accounts filed.', '2025-06-28T00:00:00Z'),
  complianceReq(IDS.ENTITY.BE_PROVIDER, 'annual_filing', '2025-07-31', 2024, 'completed',
    'FY2024 SRL annual accounts filed.', '2025-07-28T00:00:00Z'),
  complianceReq(IDS.ENTITY.JP_PROVIDER, 'annual_filing', '2025-05-31', 2024, 'completed',
    'FY2024 KK annual accounts filed.', '2025-05-25T00:00:00Z'),
  complianceReq(IDS.ENTITY.GB_PROVIDER, 'annual_filing', '2025-09-30', 2024, 'completed',
    'FY2024 Ltd. annual accounts filed.', '2025-09-15T00:00:00Z'),
  complianceReq(IDS.ENTITY.IT_PROVIDER, 'annual_filing', '2025-04-30', 2024, 'completed',
    'FY2024 S.r.l. annual accounts filed.', '2025-04-20T00:00:00Z'),
  complianceReq(IDS.ENTITY.ES_PROVIDER, 'annual_filing', '2025-06-30', 2024, 'completed',
    'FY2024 S.L. annual accounts filed.', '2025-06-20T00:00:00Z'),
  complianceReq(IDS.ENTITY.AT_PROVIDER, 'annual_filing', '2025-09-30', 2024, 'completed',
    'FY2024 GmbH annual accounts filed.', '2025-09-25T00:00:00Z'),
  complianceReq(IDS.ENTITY.IN_PROVIDER, 'annual_filing', '2025-03-31', 2024, 'completed',
    'FY2024-25 annual filing completed.', '2025-03-28T00:00:00Z'),
  complianceReq(IDS.ENTITY.AE_PROVIDER, 'annual_filing', '2025-09-30', 2024, 'completed',
    'FY2024 DIFC LLC annual return filed.', '2025-09-20T00:00:00Z'),
  complianceReq(IDS.ENTITY.KR_PROVIDER, 'annual_filing', '2025-03-31', 2024, 'completed',
    'FY2024 annual accounts filed.', '2025-03-25T00:00:00Z'),
  complianceReq(IDS.ENTITY.DK_PROVIDER, 'annual_filing', '2025-06-30', 2024, 'completed',
    'FY2024 ApS annual accounts filed.', '2025-06-20T00:00:00Z'),
  complianceReq(IDS.ENTITY.FI_PROVIDER, 'annual_filing', '2025-04-30', 2024, 'completed',
    'FY2024 Oy annual accounts filed.', '2025-04-25T00:00:00Z'),
  complianceReq(IDS.ENTITY.EE_PROVIDER, 'annual_filing', '2025-06-30', 2024, 'completed',
    'FY2024 OU annual accounts filed.', '2025-06-28T00:00:00Z'),

  // Additional tax returns for some customer entities
  complianceReq(IDS.ENTITY.FR_SGC, 'tax_return', '2026-05-31', 2025, 'pending',
    'CIT return due end of May.'),
  complianceReq(IDS.ENTITY.NL_RABOBANK, 'tax_return', '2026-05-31', 2025, 'pending',
    'CIT return due May 31.'),
  complianceReq(IDS.ENTITY.SE_SWEDBANK, 'tax_return', '2026-07-01', 2025, 'pending',
    'CIT return due Jul 1.'),
  complianceReq(IDS.ENTITY.BE_KBC, 'tax_return', '2026-09-30', 2025, 'pending',
    'CIT return due Sep 30.'),
  complianceReq(IDS.ENTITY.SG_DBS, 'tax_return', '2026-11-30', 2025, 'pending',
    'ECI filing.'),
  complianceReq(IDS.ENTITY.JP_SMBC, 'tax_return', '2026-05-31', 2025, 'pending',
    'CIT return due 2 months after FYE.'),
  complianceReq(IDS.ENTITY.GB_LLOYDS, 'tax_return', '2026-12-31', 2025, 'pending',
    'Corporation tax due 12 months after FYE.'),
  complianceReq(IDS.ENTITY.IT_INTESA, 'tax_return', '2026-10-31', 2025, 'pending',
    'CIT due Oct 31.'),
  complianceReq(IDS.ENTITY.ES_CAIXA, 'tax_return', '2026-07-25', 2025, 'pending',
    'CIT due Jul 25.'),
  complianceReq(IDS.ENTITY.AT_BAWAG, 'tax_return', '2026-06-30', 2025, 'pending',
    'CIT due Jun 30.'),
  complianceReq(IDS.ENTITY.AE_EMIRATES, 'tax_return', '2026-09-30', 2025, 'pending',
    'CIT due Sep 30.'),
  complianceReq(IDS.ENTITY.BR_ITAU, 'tax_return', '2026-07-31', 2025, 'pending',
    'CIT due Jul 31.'),
  complianceReq(IDS.ENTITY.CA_RBC, 'tax_return', '2026-06-30', 2025, 'pending',
    'CIT due Jun 30.'),
  complianceReq(IDS.ENTITY.AU_CBA, 'tax_return', '2027-01-15', 2025, 'pending',
    'Tax return due Jan 15 following FYE.'),
  complianceReq(IDS.ENTITY.IN_HDFC, 'tax_return', '2026-10-31', 2025, 'pending',
    'CIT due Oct 31.'),
  complianceReq(IDS.ENTITY.FI_NORDEA, 'tax_return', '2026-04-30', 2025, 'pending',
    'CIT due 4 months after FYE.'),
  complianceReq(IDS.ENTITY.DK_DANSKE, 'tax_return', '2026-06-30', 2025, 'pending',
    'CIT due Jun 30.'),
  complianceReq(IDS.ENTITY.PL_PKO, 'tax_return', '2026-03-31', 2025, 'pending',
    'CIT due Mar 31.'),

  // =========================================================================
  // Additional agent_renewal requirements for providers (to reach 150+ total)
  // =========================================================================

  complianceReq(IDS.ENTITY.DE_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for WM Corporate GmbH.'),
  complianceReq(IDS.ENTITY.FR_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for France Corporate Services.'),
  complianceReq(IDS.ENTITY.NL_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for TMF Netherlands B.V.'),
  complianceReq(IDS.ENTITY.EE_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for Lelaw OU.'),
  complianceReq(IDS.ENTITY.SE_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for Setterwalls.'),
  complianceReq(IDS.ENTITY.BE_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for Linklaters Brussels.'),
  complianceReq(IDS.ENTITY.SG_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for Boardroom Singapore.'),
  complianceReq(IDS.ENTITY.JP_PROVIDER, 'agent_renewal', daysFromSeed(30), null, 'pending',
    'Registered agent renewal for Japan Corporate Agent K.K.'),
  complianceReq(IDS.ENTITY.FI_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for Fondia Oyj.'),
  complianceReq(IDS.ENTITY.DK_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for Kromann Reumert.'),
  complianceReq(IDS.ENTITY.NO_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for Wikborg Rein.'),
  complianceReq(IDS.ENTITY.GB_PROVIDER, 'agent_renewal', daysFromSeed(60), null, 'pending',
    'Registered agent renewal for TMF UK Ltd.'),
  complianceReq(IDS.ENTITY.IT_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for Studio Legale Toffoletto.'),
  complianceReq(IDS.ENTITY.ES_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for Garrigues.'),
  complianceReq(IDS.ENTITY.AT_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for Binder Groesswang.'),
  complianceReq(IDS.ENTITY.IN_PROVIDER, 'agent_renewal', daysFromSeed(90), null, 'pending',
    'Registered agent renewal for Legasis Partners.'),
  complianceReq(IDS.ENTITY.AE_PROVIDER, 'agent_renewal', daysFromSeed(90), null, 'pending',
    'Registered agent renewal for Vistra DIFC Ltd.'),
  complianceReq(IDS.ENTITY.KR_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for KR Corporate Services.'),
  complianceReq(IDS.ENTITY.BR_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for Mattos Filho.'),
  complianceReq(IDS.ENTITY.CA_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for Torys LLP.'),
  complianceReq(IDS.ENTITY.AU_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for Herbert Smith Freehills.'),
  complianceReq(IDS.ENTITY.PL_PROVIDER, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for Wardynski & Partners.'),
  complianceReq(IDS.ENTITY.AE_ABU_DHABI, 'agent_renewal', daysFromSeed(90), null, 'pending',
    'Registered agent renewal for Vistra DIFC Ltd (Abu Dhabi).'),

  // LU HQ agent_renewal
  complianceReq(IDS.ENTITY.LU_HQ, 'agent_renewal', daysFromSeed(15), null, 'pending',
    'Registered agent renewal for Lux Corporate Services.'),

  // Additional completed tax returns for some providers (FY2024)
  complianceReq(IDS.ENTITY.SG_PROVIDER, 'tax_return', '2025-11-30', 2024, 'completed',
    'FY2024 ECI filing completed.', '2025-11-15T00:00:00Z'),
  complianceReq(IDS.ENTITY.JP_PROVIDER, 'tax_return', '2025-05-31', 2024, 'completed',
    'FY2024 CIT return filed.', '2025-05-28T00:00:00Z'),
  complianceReq(IDS.ENTITY.KR_PROVIDER, 'tax_return', '2025-03-31', 2024, 'completed',
    'FY2024 CIT return filed.', '2025-03-28T00:00:00Z'),
  complianceReq(IDS.ENTITY.BR_PROVIDER, 'tax_return', '2025-07-31', 2024, 'completed',
    'FY2024 CIT return filed.', '2025-07-25T00:00:00Z'),
  complianceReq(IDS.ENTITY.CA_PROVIDER, 'tax_return', '2025-06-30', 2024, 'completed',
    'FY2024 CIT return filed.', '2025-06-25T00:00:00Z'),
]

// ---------------------------------------------------------------------------
// Intercompany Agreements (~62 rows — one per non-HQ entity)
// ---------------------------------------------------------------------------

// Agreement ID format: e0000000-0000-0000-0000-000000000NNN
let agrCounter = 0
function agrId(): string {
  agrCounter++
  return `e0000000-0000-0000-0000-${String(agrCounter).padStart(12, '0')}`
}

// Non-HQ entities, in order, for agreement generation
const NON_HQ_ENTITIES = ENTITIES.filter((e) => e.entity_purpose !== 'hq')

function makeAgreement(
  entity: typeof ENTITIES[number],
  agreement_type: string,
  title: string,
  key_terms: Record<string, unknown>,
  status: 'active' | 'expired' | 'draft' = 'active',
  expiry_date: string | null = null,
) {
  // effective_date: 30 days after incorporation_date
  const incDate = new Date(entity.incorporation_date)
  incDate.setDate(incDate.getDate() + 30)
  const effective_date = incDate.toISOString().split('T')[0]

  return {
    id: agrId(),
    entity_id: entity.id,
    hq_entity_id: HQ_ID,
    agreement_type,
    title,
    effective_date,
    expiry_date,
    governing_law: 'Luxembourg',
    parties: [
      { name: entity.legal_name, role: 'Service Recipient', entity_id: entity.id },
      { name: 'Hopae S.a r.l.', role: 'Service Provider', entity_id: HQ_ID },
    ],
    key_terms,
    document_id: null,
    status,
  }
}

// Build agreements array
const INTERCOMPANY_AGREEMENTS: ReturnType<typeof makeAgreement>[] = []

// Dissolving entity IDs
const DISSOLVING_IDS: Set<string> = new Set([IDS.ENTITY.BE_GHENT_BRANCH, IDS.ENTITY.EE_TALLINN_BRANCH])

// Newest entity IDs (for 'draft' status): PL_PKO, DK_DANSKE, FI_NORDEA
const DRAFT_IDS: Set<string> = new Set([IDS.ENTITY.PL_PKO, IDS.ENTITY.DK_DANSKE, IDS.ENTITY.FI_NORDEA])

// Expired (non-dissolving) IDs: pick 3 older customer entities
const EXPIRED_IDS: Set<string> = new Set([IDS.ENTITY.NL_ABN, IDS.ENTITY.SE_HANDELS, IDS.ENTITY.FR_ING])

for (let i = 0; i < NON_HQ_ENTITIES.length; i++) {
  const ent = NON_HQ_ENTITIES[i]

  // Determine agreement type based on distribution
  let agreement_type: string
  let title: string
  let key_terms: Record<string, unknown>

  if (ent.entity_purpose === 'provider_key') {
    // All 23 provider_key entities get service_agreement
    agreement_type = 'service_agreement'
    title = `Technology Service Agreement - ${ent.name}`
    key_terms = {
      fee_amount: 50000,
      payment_terms: 'Quarterly',
      ip_scope: 'Hopae eID integration platform, licensed non-exclusively',
    }
  } else if (ent.entity_purpose === 'branch') {
    // Branches get data_processing (7)
    agreement_type = 'data_processing'
    title = `Data Processing Agreement - ${ent.name}`
    key_terms = {
      fee_amount: 0,
      payment_terms: 'N/A - GDPR compliance',
      data_types: 'Personal identity data, verification records',
    }
  } else {
    // Customer entities (28) — distribute: 15 ip_license, 10 management_fee, 3 loan_agreement (remaining are already covered)
    const customerIdx = i - 23 // offset within customer entities
    if (customerIdx < 15) {
      agreement_type = 'ip_license'
      title = `IP License Agreement - ${ent.name}`
      key_terms = {
        fee_amount: 25000,
        payment_terms: 'Annually',
        ip_scope: 'Hopae trademark and technology stack license',
      }
    } else if (customerIdx < 25) {
      agreement_type = 'management_fee'
      title = `Management Fee Agreement - ${ent.name}`
      key_terms = {
        fee_amount: 75000,
        payment_terms: 'Quarterly',
        management_scope: 'Operational management, regulatory compliance oversight',
      }
    } else {
      agreement_type = 'loan_agreement'
      title = `Intercompany Loan Agreement - ${ent.name}`
      const incDate = new Date(ent.incorporation_date)
      incDate.setDate(incDate.getDate() + 30)
      const loanStart = incDate.toISOString().split('T')[0]
      const loanEnd = new Date(incDate)
      loanEnd.setFullYear(loanEnd.getFullYear() + 5)
      key_terms = {
        fee_amount: 500000,
        payment_terms: '5-year term, EURIBOR + 1.5%',
        loan_start: loanStart,
        loan_maturity: loanEnd.toISOString().split('T')[0],
      }
    }
  }

  // Determine status
  let status: 'active' | 'expired' | 'draft' = 'active'
  if (DISSOLVING_IDS.has(ent.id) || EXPIRED_IDS.has(ent.id)) {
    status = 'expired'
  } else if (DRAFT_IDS.has(ent.id)) {
    status = 'draft'
  }

  // Determine expiry_date for loan agreements
  let expiry_date: string | null = null
  if (agreement_type === 'loan_agreement') {
    const incDate = new Date(ent.incorporation_date)
    incDate.setDate(incDate.getDate() + 30)
    const loanEnd = new Date(incDate)
    loanEnd.setFullYear(loanEnd.getFullYear() + 5)
    expiry_date = loanEnd.toISOString().split('T')[0]
  }

  INTERCOMPANY_AGREEMENTS.push(makeAgreement(ent, agreement_type, title, key_terms, status, expiry_date))
}

// ---------------------------------------------------------------------------
// Alerts (~12 rows)
// ---------------------------------------------------------------------------

// Alert ID format: f0000000-0000-0000-0000-000000000NNN
let alertCounter = 0
function alertId(): string {
  alertCounter++
  return `f0000000-0000-0000-0000-${String(alertCounter).padStart(12, '0')}`
}

// Build alerts referencing the compliance requirements by their deterministic IDs
// The COMPLIANCE_REQUIREMENTS array is 0-indexed:
// [0] = BR overdue, [1] = PL overdue, [2] = BE Ghent overdue
// [3] = KR tax_return, [4] = PL tax_return, [5] = IN annual_filing, [6] = FI tax_return, [7] = KR_KB tax_return

const ALERTS = [
  // ---- OVERDUE ALERTS (3+) ----
  {
    id: alertId(),
    entity_id: IDS.ENTITY.BR_PROVIDER,
    requirement_id: COMPLIANCE_REQUIREMENTS[0].id,
    alert_type: 'overdue',
    message: 'Annual filing for FY2025 is 41 days overdue. Immediate action required.',
    due_date: '2026-01-31',
    resolved: false,
    resolved_at: null,
  },
  {
    id: alertId(),
    entity_id: IDS.ENTITY.PL_PROVIDER,
    requirement_id: COMPLIANCE_REQUIREMENTS[1].id,
    alert_type: 'overdue',
    message: 'FY2025 annual accounts are 13 days overdue. File immediately to avoid penalties.',
    due_date: '2026-02-28',
    resolved: false,
    resolved_at: null,
  },
  {
    id: alertId(),
    entity_id: IDS.ENTITY.BE_GHENT_BRANCH,
    requirement_id: COMPLIANCE_REQUIREMENTS[2].id,
    alert_type: 'overdue',
    message: 'Registered agent renewal lapsed 40 days ago. Branch in dissolution — ensure wind-down compliance.',
    due_date: '2026-02-01',
    resolved: false,
    resolved_at: null,
  },

  // ---- DUE-SOON ALERTS (5+) ----
  {
    id: alertId(),
    entity_id: IDS.ENTITY.KR_PROVIDER,
    requirement_id: COMPLIANCE_REQUIREMENTS[3].id,
    alert_type: 'due_soon',
    message: 'Tax return due in 18 days (2026-03-31). Prepare filing documents.',
    due_date: '2026-03-31',
    resolved: false,
    resolved_at: null,
  },
  {
    id: alertId(),
    entity_id: IDS.ENTITY.PL_PROVIDER,
    requirement_id: COMPLIANCE_REQUIREMENTS[4].id,
    alert_type: 'due_soon',
    message: 'CIT return due in 18 days (2026-03-31). Prepare filing documents.',
    due_date: '2026-03-31',
    resolved: false,
    resolved_at: null,
  },
  {
    id: alertId(),
    entity_id: IDS.ENTITY.IN_PROVIDER,
    requirement_id: COMPLIANCE_REQUIREMENTS[5].id,
    alert_type: 'due_soon',
    message: 'Annual filing due in 18 days (2026-03-31). India FYE Mar 31 — prepare documents.',
    due_date: '2026-03-31',
    resolved: false,
    resolved_at: null,
  },
  {
    id: alertId(),
    entity_id: IDS.ENTITY.FI_PROVIDER,
    requirement_id: COMPLIANCE_REQUIREMENTS[6].id,
    alert_type: 'due_soon',
    message: 'Tax return due in 28 days (2026-04-10). CIT filing 4 months after FYE.',
    due_date: '2026-04-10',
    resolved: false,
    resolved_at: null,
  },
  {
    id: alertId(),
    entity_id: IDS.ENTITY.KR_KB,
    requirement_id: COMPLIANCE_REQUIREMENTS[7].id,
    alert_type: 'due_soon',
    message: 'Tax return due in 18 days (2026-03-31). Prepare filing documents.',
    due_date: '2026-03-31',
    resolved: false,
    resolved_at: null,
  },

  // ---- DISSOLUTION-RISK ALERTS (2) ----
  {
    id: alertId(),
    entity_id: IDS.ENTITY.BE_GHENT_BRANCH,
    requirement_id: null,
    alert_type: 'at_risk',
    message: 'Entity in dissolution process. Ensure all wind-down obligations are met before final deregistration.',
    due_date: null,
    resolved: false,
    resolved_at: null,
  },
  {
    id: alertId(),
    entity_id: IDS.ENTITY.EE_TALLINN_BRANCH,
    requirement_id: null,
    alert_type: 'at_risk',
    message: 'Entity in dissolution process. Operations consolidating to HQ. Verify all regulatory filings are current.',
    due_date: null,
    resolved: false,
    resolved_at: null,
  },

  // ---- Additional due_soon for completeness ----
  {
    id: alertId(),
    entity_id: IDS.ENTITY.IN_HDFC,
    requirement_id: COMPLIANCE_REQUIREMENTS.find(
      (r) => r.entity_id === IDS.ENTITY.IN_HDFC && r.requirement_type === 'annual_filing'
    )!.id,
    alert_type: 'due_soon',
    message: 'Annual filing due in 18 days (2026-03-31). India FYE Mar 31.',
    due_date: '2026-03-31',
    resolved: false,
    resolved_at: null,
  },
]

// ---------------------------------------------------------------------------
// main() — seed function
// ---------------------------------------------------------------------------

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('Seeding database...')
  console.log(`Seed date: ${SEED_DATE.toISOString().split('T')[0]}`)

  // 1. Truncate all 7 tables in reverse FK order
  const tablesToTruncate = [
    'alerts',
    'intercompany_agreements',
    'compliance_requirements',
    'documents',
    'directors',
    'entities',
    'jurisdictions',
  ]

  for (const table of tablesToTruncate) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) {
      console.error(`Failed to truncate ${table}:`, error)
      process.exit(1)
    }
    console.log(`  Truncated: ${table}`)
  }

  // 2. Seed jurisdictions
  const { error: jErr } = await supabase.from('jurisdictions').insert(JURISDICTIONS)
  if (jErr) {
    console.error('Failed to insert jurisdictions:', jErr)
    process.exit(1)
  }
  console.log(`  Inserted: ${JURISDICTIONS.length} jurisdictions`)

  // 3. Seed entities — HQ first (it has null parent), then rest
  const hqEntity = ENTITIES.find((e) => e.entity_purpose === 'hq')!
  const otherEntities = ENTITIES.filter((e) => e.entity_purpose !== 'hq')

  // Insert HQ first
  const { error: hqErr } = await supabase.from('entities').insert([hqEntity])
  if (hqErr) {
    console.error('Failed to insert HQ entity:', hqErr)
    process.exit(1)
  }
  console.log(`  Inserted: HQ entity (${hqEntity.name})`)

  // Insert subsidiaries (provider_key + customer_entity with parent = HQ)
  const subsidiaries = otherEntities.filter(
    (e) => e.parent_entity_id === HQ_ID
  )
  const { error: subErr } = await supabase.from('entities').insert(subsidiaries)
  if (subErr) {
    console.error('Failed to insert subsidiaries:', subErr)
    process.exit(1)
  }
  console.log(`  Inserted: ${subsidiaries.length} subsidiaries`)

  // Insert branches (parent = subsidiary)
  const branches = otherEntities.filter(
    (e) => e.parent_entity_id !== HQ_ID && e.parent_entity_id !== null
  )
  if (branches.length > 0) {
    const { error: brErr } = await supabase.from('entities').insert(branches)
    if (brErr) {
      console.error('Failed to insert branches:', brErr)
      process.exit(1)
    }
    console.log(`  Inserted: ${branches.length} branches`)
  }

  const totalEntities = 1 + subsidiaries.length + branches.length
  console.log(`  Total entities: ${totalEntities}`)

  // Count entity purposes
  const purposeCounts = ENTITIES.reduce(
    (acc, e) => {
      acc[e.entity_purpose] = (acc[e.entity_purpose] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
  console.log(`  Entity purposes: ${JSON.stringify(purposeCounts)}`)

  // Count dissolving
  const dissolvingCount = ENTITIES.filter((e) => e.status === 'dissolving').length
  console.log(`  Dissolving entities: ${dissolvingCount}`)

  // 4. Seed directors
  const { error: dErr } = await supabase.from('directors').insert(DIRECTORS)
  if (dErr) {
    console.error('Failed to insert directors:', dErr)
    process.exit(1)
  }
  console.log(`  Inserted: ${DIRECTORS.length} directors`)

  // Verify every entity has at least 1 director
  const entityIdsWithDirectors = new Set(DIRECTORS.map((d) => d.entity_id))
  const entitiesWithoutDirectors = ENTITIES.filter((e) => !entityIdsWithDirectors.has(e.id))
  if (entitiesWithoutDirectors.length > 0) {
    console.error('WARNING: Entities without directors:', entitiesWithoutDirectors.map((e) => e.name))
  }

  // 5. Seed compliance requirements
  const { error: crErr } = await supabase.from('compliance_requirements').insert(COMPLIANCE_REQUIREMENTS)
  if (crErr) {
    console.error('Failed to insert compliance_requirements:', crErr)
    process.exit(1)
  }
  console.log(`  Inserted: ${COMPLIANCE_REQUIREMENTS.length} compliance requirements`)

  // Count statuses
  const statusCounts = COMPLIANCE_REQUIREMENTS.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc },
    {} as Record<string, number>,
  )
  console.log(`  Compliance statuses: ${JSON.stringify(statusCounts)}`)

  // 6. Seed intercompany agreements
  const { error: iaErr } = await supabase.from('intercompany_agreements').insert(INTERCOMPANY_AGREEMENTS)
  if (iaErr) {
    console.error('Failed to insert intercompany_agreements:', iaErr)
    process.exit(1)
  }
  console.log(`  Inserted: ${INTERCOMPANY_AGREEMENTS.length} intercompany agreements`)

  // Verify every non-HQ entity has an agreement
  const entityIdsWithAgreements = new Set(INTERCOMPANY_AGREEMENTS.map((a) => a.entity_id))
  const nonHqWithoutAgreements = ENTITIES.filter(
    (e) => e.entity_purpose !== 'hq' && !entityIdsWithAgreements.has(e.id)
  )
  if (nonHqWithoutAgreements.length > 0) {
    console.error('WARNING: Non-HQ entities without agreements:', nonHqWithoutAgreements.map((e) => e.name))
  }

  // 7. Seed alerts (LAST — references compliance_requirements)
  const { error: alErr } = await supabase.from('alerts').insert(ALERTS)
  if (alErr) {
    console.error('Failed to insert alerts:', alErr)
    process.exit(1)
  }
  console.log(`  Inserted: ${ALERTS.length} alerts`)

  // Count alert types
  const alertTypeCounts = ALERTS.reduce(
    (acc, a) => { acc[a.alert_type] = (acc[a.alert_type] || 0) + 1; return acc },
    {} as Record<string, number>,
  )
  console.log(`  Alert types: ${JSON.stringify(alertTypeCounts)}`)

  console.log('\nSeed complete — all 7 tables populated.')
  console.log(`  Jurisdictions:            ${JURISDICTIONS.length}`)
  console.log(`  Entities:                 ${totalEntities}`)
  console.log(`  Directors:                ${DIRECTORS.length}`)
  console.log(`  Compliance requirements:  ${COMPLIANCE_REQUIREMENTS.length}`)
  console.log(`  Intercompany agreements:  ${INTERCOMPANY_AGREEMENTS.length}`)
  console.log(`  Alerts:                   ${ALERTS.length}`)
  console.log(`  Documents:                0 (seeded in later phases)`)
  process.exit(0)
}

main()
