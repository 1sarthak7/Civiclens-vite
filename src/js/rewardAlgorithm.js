// ═══════════════════════════════════════════════════════════
// CIVIC LENS — Complaint Reward Algorithm (Browser ES Module)
// v2 — Reduced earning + Tier-based Redemption Catalog
// ═══════════════════════════════════════════════════════════

// ── 1. EARNING CONFIG ────────────────────────────────────────
// Base credits REDUCED to make earning harder (~20-40 avg)

export const SEVERITY_BASE_CREDITS = {
  low:      5,
  medium:   15,
  high:     30,
  critical: 60,
};

// Multipliers mapped to CivicLens UI categories
export const CATEGORY_MULTIPLIERS = {
  Roads:       1.0,
  Garbage:     1.2,
  Water:       1.3,
  Streetlight: 1.1,
  Drainage:    1.2,
  Other:       1.0,
};

// Speed bonus tiers
export const SPEED_TIERS = [
  { maxHours: 24,   label: '≤ 24 hours',  multiplier: 1.5 },
  { maxHours: 168,  label: '≤ 7 days',    multiplier: 1.2 },
  { maxHours: 720,  label: '≤ 30 days',   multiplier: 1.0 },
  { maxHours: Infinity, label: '> 30 days', multiplier: 0.8 },
];

// Global caps
const MIN_CREDITS = 3;
const MAX_CREDITS = 150;

// ── 2. EARNING HELPERS ──────────────────────────────────────

function getSpeedMultiplier(resolutionHours) {
  for (const tier of SPEED_TIERS) {
    if (resolutionHours <= tier.maxHours) return tier.multiplier;
  }
  return 0.8;
}

// ── 3. EARNING FUNCTION ─────────────────────────────────────

export function calculateReward({ severity, category, filedAt, resolvedAt }) {
  const sev = (severity || 'medium').toLowerCase();
  if (!SEVERITY_BASE_CREDITS[sev]) {
    console.warn(`Unknown severity "${severity}", defaulting to "medium".`);
  }

  const baseCredits     = SEVERITY_BASE_CREDITS[sev] ?? SEVERITY_BASE_CREDITS['medium'];
  const categoryMult    = CATEGORY_MULTIPLIERS[category] ?? CATEGORY_MULTIPLIERS['Other'];
  const filed           = new Date(filedAt);
  const resolved        = new Date(resolvedAt);
  const resolutionHours = Math.max(0, (resolved - filed) / (1000 * 60 * 60));
  const speedMult       = getSpeedMultiplier(resolutionHours);

  const raw     = baseCredits * categoryMult * speedMult;
  const credits = Math.min(MAX_CREDITS, Math.max(MIN_CREDITS, Math.round(raw)));

  const speedLabel = SPEED_TIERS.find(t => resolutionHours <= t.maxHours)?.label || '> 30 days';

  return {
    credits,
    breakdown: {
      severity: sev,
      baseCredits,
      category,
      categoryMultiplier: categoryMult,
      speedMultiplier:    speedMult,
      speedLabel,
      resolutionHours:    Math.round(resolutionHours),
      rawScore:           Math.round(raw * 100) / 100,
      finalCredits:       credits,
    },
  };
}

// ── 4. SEVERITY METADATA (for UI) ───────────────────────────

export const SEVERITY_OPTIONS = [
  { key: 'low',      label: 'Low',      color: '#22c55e', icon: '<span class="sev-dot" style="background:#22c55e"></span>', desc: 'Minor inconvenience' },
  { key: 'medium',   label: 'Medium',   color: '#f59e0b', icon: '<span class="sev-dot" style="background:#f59e0b"></span>', desc: 'Moderate impact' },
  { key: 'high',     label: 'High',     color: '#ef4444', icon: '<span class="sev-dot" style="background:#ef4444"></span>', desc: 'Significant issue' },
  { key: 'critical', label: 'Critical', color: '#dc2626', icon: '<span class="sev-dot" style="background:#dc2626"></span>', desc: 'Emergency / safety risk' },
];


// ═══════════════════════════════════════════════════════════
// 5. TIER-BASED REDEMPTION SYSTEM
// ═══════════════════════════════════════════════════════════

// Tier configuration — weights derived from severity tiers
export const TIER_CONFIG = {
  A: {
    key: 'A',
    name: 'Utility Bill Relief',
    tagline: 'Reduce your basic living costs',
    icon: '⚡',
    weight: 1.0,          // highest cost tier
    gradient: ['#0F2854', '#1C4D8D'],
    accentColor: '#1C4D8D',
    badgeColor: '#3b82f6',
  },
  B: {
    key: 'B',
    name: 'Urban Mobility',
    tagline: 'Daily commuting benefits',
    icon: '🚇',
    weight: 0.65,          // mid cost tier
    gradient: ['#7c2d12', '#c2410c'],
    accentColor: '#ea580c',
    badgeColor: '#f97316',
  },
  C: {
    key: 'C',
    name: 'Social & Recreational',
    tagline: 'Lifestyle + Education perks',
    icon: '🎓',
    weight: 0.4,           // lowest cost tier
    gradient: ['#064e3b', '#059669'],
    accentColor: '#059669',
    badgeColor: '#10b981',
  },
};

// Redemption catalog — costs algorithmically derived
// Formula: round(MAX_CREDITS × tierWeight × benefitMultiplier × discountDepth)
export const REDEMPTION_CATALOG = [
  // ── TIER A: Utility Bill Relief ──
  {
    id: 'elec_bill',
    tier: 'A',
    name: 'Electricity Bill Reduction',
    desc: '5% off your current month\'s electricity bill. Apply via the official utility portal.',
    benefit: '5% off electricity bill',
    cost: 120,   // 150 × 1.0 × 1.1 × 0.73 ≈ 120
    iconKey: 'electricity',
  },
  {
    id: 'water_tax',
    tier: 'A',
    name: 'Water Tax Rebate',
    desc: '5% waiver on your monthly water tax. Present coupon at municipal office.',
    benefit: '5% water tax waiver',
    cost: 100,   // 150 × 1.0 × 1.3 × 0.51 ≈ 100
    iconKey: 'water',
  },

  // ── TIER B: Urban Mobility ──
  {
    id: 'metro_pass',
    tier: 'B',
    name: 'Metro Pass',
    desc: 'Free one-way metro ride. Valid at any metro station counter or kiosk.',
    benefit: 'Free one-way metro ride',
    cost: 80,    // 150 × 0.65 × 1.0 × 0.82 ≈ 80
    iconKey: 'metro',
  },
  {
    id: 'bus_nonac',
    tier: 'B',
    name: 'Bus Fare Discount (Non-AC)',
    desc: '5% discount on government non-AC bus fares. Show coupon to conductor.',
    benefit: '5% off non-AC bus fare',
    cost: 40,    // 150 × 0.65 × 1.0 × 0.41 ≈ 40
    iconKey: 'bus',
  },
  {
    id: 'bus_ac',
    tier: 'B',
    name: 'Bus Fare Discount (AC)',
    desc: 'Up to 10% discount on government AC bus fares. Maximum cap applies.',
    benefit: '10% off AC bus fare',
    cost: 60,    // 150 × 0.65 × 1.0 × 0.615 ≈ 60
    iconKey: 'bus',
  },
  {
    id: 'parking',
    tier: 'B',
    name: 'Parking Waiver',
    desc: '1 hour free parking in any municipal smart parking zone.',
    benefit: '1hr free smart parking',
    cost: 50,    // 150 × 0.65 × 1.0 × 0.51 ≈ 50
    iconKey: 'parking',
  },

  // ── TIER C: Social & Recreational ──
  {
    id: 'museum_zoo',
    tier: 'C',
    name: 'Public Amenities Entry',
    desc: 'Free entry to government museums, zoos, and public libraries.',
    benefit: 'Free museum/zoo/library entry',
    cost: 25,    // 150 × 0.4 × 1.0 × 0.42 ≈ 25
    iconKey: 'museum',
  },
  {
    id: 'sports',
    tier: 'C',
    name: 'Sports Facility Access',
    desc: 'Access to public swimming pools, tennis courts, and badminton halls.',
    benefit: 'Pool/tennis/badminton access',
    cost: 35,    // 150 × 0.4 × 1.0 × 0.58 ≈ 35
    iconKey: 'sports',
  },
  {
    id: 'exam_state',
    tier: 'C',
    name: 'State Exam Fee Waiver',
    desc: '10% discount on state-level examination fees. Apply during registration.',
    benefit: '10% off state exam fees',
    cost: 45,    // 150 × 0.4 × 1.0 × 0.75 ≈ 45
    iconKey: 'exam',
  },
  {
    id: 'exam_central',
    tier: 'C',
    name: 'Central Exam Fee Waiver',
    desc: '18% discount on central-level examination fees. Apply during registration.',
    benefit: '18% off central exam fees',
    cost: 60,    // 150 × 0.4 × 1.0 × 1.0 ≈ 60
    iconKey: 'exam',
  },
];

// Helper: get rewards by tier
export function getRewardsByTier(tierKey) {
  return REDEMPTION_CATALOG.filter(r => r.tier === tierKey);
}
