// ═══════════════════════════════════════════════════════════
// CIVIC LENS — Complaint Reward Algorithm (Browser ES Module)
// Adapted from complaintRewardAlgorithm.js
// ═══════════════════════════════════════════════════════════

// ── 1. CONFIG ────────────────────────────────────────────────

export const SEVERITY_BASE_CREDITS = {
  low:      10,
  medium:   30,
  high:     60,
  critical: 120,
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
const MIN_CREDITS = 5;
const MAX_CREDITS = 300;

// ── 2. HELPERS ───────────────────────────────────────────────

function getSpeedMultiplier(resolutionHours) {
  for (const tier of SPEED_TIERS) {
    if (resolutionHours <= tier.maxHours) return tier.multiplier;
  }
  return 0.8;
}

// ── 3. CORE FUNCTION ─────────────────────────────────────────

/**
 * Calculate reward credits for a resolved complaint.
 *
 * @param {Object} params
 * @param {string} params.severity    - 'low' | 'medium' | 'high' | 'critical'
 * @param {string} params.category    - CivicLens category (Roads, Water, etc.)
 * @param {Date|string} params.filedAt    - when the complaint was submitted
 * @param {Date|string} params.resolvedAt - when the complaint was resolved
 *
 * @returns {Object} { credits, breakdown }
 */
export function calculateReward({ severity, category, filedAt, resolvedAt }) {
  // ── Validate severity ──
  const sev = (severity || 'medium').toLowerCase();
  if (!SEVERITY_BASE_CREDITS[sev]) {
    console.warn(`Unknown severity "${severity}", defaulting to "medium".`);
  }

  // ── Compute each factor ──
  const baseCredits     = SEVERITY_BASE_CREDITS[sev] ?? SEVERITY_BASE_CREDITS['medium'];
  const categoryMult    = CATEGORY_MULTIPLIERS[category] ?? CATEGORY_MULTIPLIERS['Other'];
  const filed           = new Date(filedAt);
  const resolved        = new Date(resolvedAt);
  const resolutionHours = Math.max(0, (resolved - filed) / (1000 * 60 * 60));
  const speedMult       = getSpeedMultiplier(resolutionHours);

  // ── Apply formula ──
  const raw     = baseCredits * categoryMult * speedMult;
  const credits = Math.min(MAX_CREDITS, Math.max(MIN_CREDITS, Math.round(raw)));

  // Friendly labels
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
