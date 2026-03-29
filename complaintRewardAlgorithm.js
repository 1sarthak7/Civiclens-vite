// ─────────────────────────────────────────────────────────────
//  Government Complaint Reward Algorithm  (v2 — Reduced Earning)
//  Stack: Node.js / JavaScript
// ─────────────────────────────────────────────────────────────

// ── 1. CONFIG ────────────────────────────────────────────────
// Base credits REDUCED to make earning harder (~20-40 avg per complaint)

const SEVERITY_BASE_CREDITS = {
  low:      5,
  medium:   15,
  high:     30,
  critical: 60,
};

// Multipliers per complaint category.
const CATEGORY_MULTIPLIERS = {
  roads_potholes:   1.0,
  electricity:      1.1,
  water_supply:     1.3,
  sanitation:       1.2,
  public_safety:    1.5,
  street_lighting:  1.1,
  parks_gardens:    0.9,
  noise_pollution:  0.8,
  other:            1.0,
};

// Speed bonus based on how fast the complaint was resolved.
function getSpeedMultiplier(resolutionHours) {
  if (resolutionHours <= 24)   return 1.5;  // resolved within 1 day
  if (resolutionHours <= 168)  return 1.2;  // resolved within 7 days
  if (resolutionHours <= 720)  return 1.0;  // resolved within 30 days
  return 0.8;                               // took longer than 30 days
}

// Global caps
const MIN_CREDITS = 3;
const MAX_CREDITS = 150;

// ── 2. CORE FUNCTION ─────────────────────────────────────────

function calculateReward(complaint) {
  const { severity, category, filedAt, resolvedAt } = complaint;

  if (!SEVERITY_BASE_CREDITS[severity]) {
    throw new Error(`Unknown severity: "${severity}". Valid: ${Object.keys(SEVERITY_BASE_CREDITS).join(', ')}`);
  }

  const categoryKey = category.toLowerCase().replace(/ /g, '_');
  if (!CATEGORY_MULTIPLIERS[categoryKey]) {
    console.warn(`Unknown category "${category}", defaulting to "other".`);
  }

  const baseCredits      = SEVERITY_BASE_CREDITS[severity];
  const categoryMult     = CATEGORY_MULTIPLIERS[categoryKey] ?? CATEGORY_MULTIPLIERS['other'];
  const resolutionHours  = (resolvedAt - filedAt) / (1000 * 60 * 60);
  const speedMult        = getSpeedMultiplier(resolutionHours);

  const raw     = baseCredits * categoryMult * speedMult;
  const credits = Math.min(MAX_CREDITS, Math.max(MIN_CREDITS, Math.round(raw)));

  return {
    credits,
    breakdown: {
      baseCredits,
      categoryMultiplier: categoryMult,
      speedMultiplier:    speedMult,
      resolutionHours:    Math.round(resolutionHours),
      rawScore:           Math.round(raw * 100) / 100,
      finalCredits:       credits,
    },
  };
}

// ── 3. DEMO / SMOKE TEST ─────────────────────────────────────

function hoursAgo(n) {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

const testCases = [
  {
    label: 'Low severity pothole, resolved in 5 days',
    complaint: {
      severity: 'low', category: 'roads_potholes',
      filedAt: hoursAgo(120), resolvedAt: new Date(),
    },
  },
  {
    label: 'High severity water supply, resolved in 18 hours',
    complaint: {
      severity: 'high', category: 'water_supply',
      filedAt: hoursAgo(18), resolvedAt: new Date(),
    },
  },
  {
    label: 'Critical public safety, resolved in 45 days (slow)',
    complaint: {
      severity: 'critical', category: 'public_safety',
      filedAt: hoursAgo(45 * 24), resolvedAt: new Date(),
    },
  },
  {
    label: 'Medium electricity issue, resolved in 2 hours',
    complaint: {
      severity: 'medium', category: 'electricity',
      filedAt: hoursAgo(2), resolvedAt: new Date(),
    },
  },
];

console.log('=== Complaint Reward Algorithm v2 — Reduced Earning Demo ===\n');
testCases.forEach(({ label, complaint }) => {
  const { credits, breakdown } = calculateReward(complaint);
  console.log(`📋 ${label}`);
  console.log(`   Base: ${breakdown.baseCredits}  ×  Category: ${breakdown.categoryMultiplier}  ×  Speed: ${breakdown.speedMultiplier}  =  Raw: ${breakdown.rawScore}`);
  console.log(`   ✅ Credits awarded: ${credits}\n`);
});

module.exports = { calculateReward, SEVERITY_BASE_CREDITS, CATEGORY_MULTIPLIERS };
