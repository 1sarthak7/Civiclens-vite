// ═══════════════════════════════════════════════════════════
// CIVIC LENS — Rewards Page Logic (v2 — Tier-Based System)
// ═══════════════════════════════════════════════════════════

import { supabase, getCurrentUser } from './supabase.js';
import { showToast } from './notifications.js';
import {
  SEVERITY_BASE_CREDITS, CATEGORY_MULTIPLIERS, SPEED_TIERS, SEVERITY_OPTIONS,
  TIER_CONFIG, REDEMPTION_CATALOG, getRewardsByTier
} from './rewardAlgorithm.js';

// ─── Animated SVG Icons ───
const SVG_ICONS = {
  metro: `<svg class="reward-svg reward-svg--metro" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="10" y="8" width="28" height="28" rx="6" class="svg-body"/>
    <circle cx="18" cy="30" r="2.5" class="svg-wheel svg-wheel--left"/>
    <circle cx="30" cy="30" r="2.5" class="svg-wheel svg-wheel--right"/>
    <line x1="14" y1="20" x2="34" y2="20" class="svg-line"/>
    <line x1="24" y1="8" x2="24" y2="20" class="svg-divider"/>
    <line x1="18" y1="36" x2="14" y2="42" class="svg-rail svg-rail--left"/>
    <line x1="30" y1="36" x2="34" y2="42" class="svg-rail svg-rail--right"/>
    <line x1="12" y1="42" x2="36" y2="42" class="svg-track"/>
  </svg>`,
  electricity: `<svg class="reward-svg reward-svg--electricity" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M28 4L14 26h10l-4 18L34 22H24l4-18z" class="svg-bolt"/>
  </svg>`,
  water: `<svg class="reward-svg reward-svg--water" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M24 4C24 4 10 20 10 30a14 14 0 0028 0C38 20 24 4 24 4z" class="svg-drop"/>
    <path d="M20 32a6 6 0 004 2" class="svg-shine" opacity="0.6"/>
  </svg>`,
  bus: `<svg class="reward-svg reward-svg--bus" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="8" y="6" width="32" height="30" rx="4" class="svg-bus-body"/>
    <line x1="8" y1="18" x2="40" y2="18" class="svg-bus-line"/>
    <line x1="24" y1="6" x2="24" y2="18" class="svg-bus-divider"/>
    <circle cx="16" cy="32" r="3" class="svg-bus-wheel svg-bus-wheel--left"/>
    <circle cx="32" cy="32" r="3" class="svg-bus-wheel svg-bus-wheel--right"/>
    <rect x="12" y="10" width="8" height="6" rx="1" class="svg-bus-window svg-bus-window--1"/>
    <rect x="28" y="10" width="8" height="6" rx="1" class="svg-bus-window svg-bus-window--2"/>
    <line x1="8" y1="38" x2="40" y2="38" class="svg-bus-ground"/>
  </svg>`,
  parking: `<svg class="reward-svg reward-svg--parking" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="8" y="4" width="32" height="40" rx="6" class="svg-sign"/>
    <path d="M19 34V14h7a8 8 0 010 16h-7" class="svg-letter"/>
  </svg>`,
  museum: `<svg class="reward-svg reward-svg--museum" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 18L24 6l20 12" class="svg-roof"/>
    <line x1="6" y1="18" x2="42" y2="18" class="svg-beam"/>
    <line x1="12" y1="18" x2="12" y2="36" class="svg-pillar svg-pillar--1"/>
    <line x1="20" y1="18" x2="20" y2="36" class="svg-pillar svg-pillar--2"/>
    <line x1="28" y1="18" x2="28" y2="36" class="svg-pillar svg-pillar--3"/>
    <line x1="36" y1="18" x2="36" y2="36" class="svg-pillar svg-pillar--4"/>
    <rect x="6" y="36" width="36" height="4" rx="1" class="svg-base"/>
    <circle cx="24" cy="10" r="2" class="svg-gem"/>
  </svg>`,
  sports: `<svg class="reward-svg reward-svg--sports" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="24" cy="24" r="16" class="svg-ball"/>
    <ellipse cx="24" cy="24" rx="16" ry="8" class="svg-ball-seam svg-ball-seam--h"/>
    <ellipse cx="24" cy="24" rx="8" ry="16" class="svg-ball-seam svg-ball-seam--v"/>
    <circle cx="24" cy="24" r="4" class="svg-ball-center"/>
  </svg>`,
  exam: `<svg class="reward-svg reward-svg--exam" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="8" y="4" width="26" height="36" rx="2" class="svg-paper"/>
    <line x1="14" y1="12" x2="28" y2="12" class="svg-text-line svg-text-line--1"/>
    <line x1="14" y1="18" x2="28" y2="18" class="svg-text-line svg-text-line--2"/>
    <line x1="14" y1="24" x2="24" y2="24" class="svg-text-line svg-text-line--3"/>
    <path d="M28 28l4 4 8-10" class="svg-checkmark"/>
    <path d="M34 4v8h8" class="svg-fold"/>
  </svg>`,
  credit: `<svg class="reward-svg reward-svg--credit" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="24" cy="24" r="18" class="svg-coin"/>
    <circle cx="24" cy="24" r="14" class="svg-coin-inner" opacity="0.3"/>
    <path d="M20 18h8a4 4 0 010 8h-8v-8zm0 8h8a4 4 0 010 8h-8" class="svg-symbol" stroke-width="2.5"/>
    <line x1="18" y1="16" x2="18" y2="34" class="svg-symbol-line" stroke-width="2.5"/>
  </svg>`,
  celebrate: `<svg class="reward-svg reward-svg--celebrate" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 42L18 16l14 14L8 42z" class="svg-cone"/>
    <circle cx="30" cy="10" r="2" class="svg-star svg-star--1"/>
    <circle cx="38" cy="18" r="1.5" class="svg-star svg-star--2"/>
    <circle cx="22" cy="8" r="1.5" class="svg-star svg-star--3"/>
    <circle cx="40" cy="8" r="1" class="svg-star svg-star--4"/>
    <path d="M34 4l1 3 3-1-1 3 3 1-3 1 1 3-3-1-1 3-1-3-3 1 1-3-3-1 3-1-1-3 3 1z" class="svg-sparkle"/>
    <line x1="18" y1="16" x2="14" y2="10" class="svg-confetti svg-confetti--1"/>
    <line x1="20" y1="18" x2="24" y2="8" class="svg-confetti svg-confetti--2"/>
    <line x1="22" y1="22" x2="32" y2="14" class="svg-confetti svg-confetti--3"/>
  </svg>`,
  gift: `<svg class="reward-svg reward-svg--gift" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="6" y="18" width="36" height="24" rx="3" class="svg-box"/>
    <rect x="4" y="12" width="40" height="8" rx="3" class="svg-lid"/>
    <line x1="24" y1="12" x2="24" y2="42" class="svg-ribbon-v"/>
    <line x1="6" y1="20" x2="42" y2="20" class="svg-ribbon-h" opacity="0"/>
    <path d="M24 12c0 0-4-8-10-8s-4 8 0 8" class="svg-bow svg-bow--left"/>
    <path d="M24 12c0 0 4-8 10-8s4 8 0 8" class="svg-bow svg-bow--right"/>
  </svg>`,
};

let currentUser = null;
let userCredits = 0;
let activeTier = 'A';

// ─── Init ───
document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await getCurrentUser();
  if (!currentUser) {
    window.location.href = 'auth.html';
    return;
  }

  setupUserInfo();

  if (currentUser.role === 'authority') {
    document.getElementById('citizen-rewards-view')?.classList.add('hidden');
    document.getElementById('admin-rewards-view')?.classList.remove('hidden');
    await loadAdminView();
  } else {
    document.getElementById('citizen-rewards-view')?.classList.remove('hidden');
    document.getElementById('admin-rewards-view')?.classList.add('hidden');
    await loadCredits();
    setupTierTabs();
    renderAllTiers();
    await loadHistory();
    setupModal();
  }
});

// ═══ TIER TABS ═══

function setupTierTabs() {
  const tabs = document.querySelectorAll('.tier-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tier = tab.dataset.tier;
      if (tier === activeTier) return;

      // Update tab active state
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Animate panel switch
      const currentPanel = document.getElementById(`tier-panel-${activeTier}`);
      const nextPanel = document.getElementById(`tier-panel-${tier}`);

      if (currentPanel) {
        currentPanel.classList.remove('active');
        currentPanel.classList.add('exiting');
        setTimeout(() => currentPanel.classList.remove('exiting'), 400);
      }

      if (nextPanel) {
        nextPanel.classList.add('entering');
        requestAnimationFrame(() => {
          nextPanel.classList.add('active');
          nextPanel.classList.remove('entering');
        });
      }

      activeTier = tier;
    });
  });
}

// ═══ RENDER REWARD CARDS ═══

function renderAllTiers() {
  ['A', 'B', 'C'].forEach(tier => {
    renderTierRewards(tier);
  });
}

function renderTierRewards(tierKey) {
  const grid = document.getElementById(`rewards-grid-${tierKey}`);
  if (!grid) return;

  const tierConfig = TIER_CONFIG[tierKey];
  const rewards = getRewardsByTier(tierKey);

  grid.innerHTML = rewards.map(reward => {
    const icon = SVG_ICONS[reward.iconKey] || SVG_ICONS.gift;
    const canAfford = userCredits >= reward.cost;
    const progress = Math.min(100, Math.round((userCredits / reward.cost) * 100));

    return `
      <div class="reward-card reward-card--tier-${tierKey}" data-reward-id="${reward.id}">
        <div class="reward-card-tier-strip" style="background: linear-gradient(135deg, ${tierConfig.gradient[0]}, ${tierConfig.gradient[1]})"></div>
        <div class="reward-card-body">
          <div class="reward-card-top">
            <div class="reward-card-icon">${icon}</div>
            <span class="reward-tier-badge" style="background: ${tierConfig.badgeColor}15; color: ${tierConfig.badgeColor}; border: 1px solid ${tierConfig.badgeColor}30;">
              Tier ${tierKey}
            </span>
          </div>
          <div class="reward-card-name">${reward.name}</div>
          <div class="reward-card-benefit">
            <svg viewBox="0 0 24 24" fill="none" stroke="${tierConfig.accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ${reward.benefit}
          </div>
          <div class="reward-card-desc">${reward.desc}</div>
          <div class="reward-card-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%; background: linear-gradient(90deg, ${tierConfig.gradient[0]}, ${tierConfig.gradient[1]})"></div>
            </div>
            <span class="progress-text">${canAfford ? '✓ Affordable' : `${userCredits}/${reward.cost} credits`}</span>
          </div>
          <div class="reward-card-footer">
            <div class="reward-cost" style="color: ${tierConfig.accentColor}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
              ${reward.cost} credits
            </div>
            <button class="redeem-btn redeem-btn--tier-${tierKey}" data-id="${reward.id}" ${!canAfford ? 'disabled' : ''}>
              ${canAfford ? 'Redeem' : 'Not Enough'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach click handlers
  grid.querySelectorAll('.redeem-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => handleRedeem(btn.dataset.id));
  });
}

// ═══ ADMIN VIEW ═══

async function loadAdminView() {
  await loadAllUsers();
}

async function loadAllUsers() {
  const loadingEl = document.getElementById('admin-users-loading');
  const tableEl = document.getElementById('admin-users-table');
  const bodyEl = document.getElementById('admin-users-body');

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, credits')
    .order('credits', { ascending: false });

  if (loadingEl) loadingEl.classList.add('hidden');

  if (error || !profiles) {
    if (loadingEl) {
      loadingEl.classList.remove('hidden');
      loadingEl.textContent = 'Failed to load users';
    }
    return;
  }

  if (tableEl) tableEl.classList.remove('hidden');

  bodyEl.innerHTML = profiles.map(p => {
    const name = p.full_name || 'Unknown';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const role = (p.role || 'citizen').charAt(0).toUpperCase() + (p.role || 'citizen').slice(1);
    const credits = p.credits || 0;

    return `
      <tr>
        <td>
          <div class="admin-user-cell">
            <span class="admin-user-avatar">${initials}</span>
            <span>${name}</span>
          </div>
        </td>
        <td><span class="admin-role-badge admin-role-badge--${p.role || 'citizen'}">${role}</span></td>
        <td>
          <input type="number" class="admin-credits-input" data-user-id="${p.id}" value="${credits}" min="0" />
        </td>
        <td>
          <button class="btn btn-ghost btn-sm admin-save-credits-btn" data-user-id="${p.id}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Update
          </button>
        </td>
      </tr>
    `;
  }).join('');

  bodyEl.querySelectorAll('.admin-save-credits-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.dataset.userId;
      const input = bodyEl.querySelector(`.admin-credits-input[data-user-id="${userId}"]`);
      const newCredits = parseInt(input?.value, 10);

      if (isNaN(newCredits) || newCredits < 0) {
        showToast('Invalid credit value', 'error');
        return;
      }

      btn.disabled = true;
      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', userId);

      if (error) {
        const { error: rpcErr } = await supabase.rpc('award_credits', {
          target_user_id: userId,
          credit_amount: newCredits - (parseInt(input.defaultValue, 10) || 0),
        });
        if (rpcErr) {
          showToast('Failed to update credits', 'error');
        } else {
          input.defaultValue = newCredits;
          showToast('Credits updated!', 'success');
        }
      } else {
        input.defaultValue = newCredits;
        showToast('Credits updated!', 'success');
      }

      btn.disabled = false;
    });
  });
}

// ─── User Info ───
function setupUserInfo() {
  const name = currentUser.full_name || 'User';
  const avatarEl = document.getElementById('rw-avatar');
  const nameEl = document.getElementById('rw-name');

  if (avatarEl) avatarEl.textContent = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  if (nameEl) nameEl.textContent = name;
}

// ─── Load Credits ───
async function loadCredits() {
  const { data, error } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', currentUser.id)
    .single();

  if (!error && data) {
    userCredits = data.credits || 0;
  }

  const { count } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id)
    .eq('status', 'Resolved');

  const { data: redemptions } = await supabase
    .from('redemptions')
    .select('reward_cost')
    .eq('user_id', currentUser.id);

  const totalRedeemed = redemptions ? redemptions.reduce((sum, r) => sum + r.reward_cost, 0) : 0;
  const totalEarned = userCredits + totalRedeemed;

  animateCounter('credit-balance', userCredits);
  animateCounter('total-earned', totalEarned);
  animateCounter('total-redeemed', totalRedeemed);
  animateCounter('total-complaints', count || 0);
}

// ─── Animate Counter ───
function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let current = 0;
  const duration = 1200;
  const steps = 40;
  const increment = target / steps;
  const stepTime = duration / steps;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.round(current);
  }, stepTime);
}

// ─── Handle Redemption ───
async function handleRedeem(rewardId) {
  const reward = REDEMPTION_CATALOG.find(r => r.id === rewardId);
  if (!reward) return;

  if (userCredits < reward.cost) {
    showToast('Not enough credits!', 'error');
    return;
  }

  const couponCode = generateCoupon(reward);

  try {
    const newCredits = userCredits - reward.cost;
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', currentUser.id);

    if (creditError) throw creditError;

    const { error: redeemError } = await supabase
      .from('redemptions')
      .insert({
        user_id: currentUser.id,
        reward_name: reward.name,
        reward_cost: reward.cost,
        coupon_code: couponCode,
        reward_tier: reward.tier,
      });

    if (redeemError) throw redeemError;

    userCredits = newCredits;

    showRedeemModal(reward, couponCode);

    document.getElementById('credit-balance').textContent = userCredits;
    renderAllTiers();
    await loadHistory();
    await loadCredits();

  } catch (err) {
    console.error('Redemption error:', err);
    showToast(err.message || 'Redemption failed', 'error');
  }
}

// ─── Generate Coupon Code ───
function generateCoupon(reward) {
  const tierPrefix = reward.tier;
  const rewardPrefix = reward.id.toUpperCase().substring(0, 3);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CL-${tierPrefix}-${rewardPrefix}-${random}`;
}

// ─── Load Redemption History ───
async function loadHistory() {
  const { data, error } = await supabase
    .from('redemptions')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('redeemed_at', { ascending: false });

  const emptyEl = document.getElementById('history-empty');
  const tableEl = document.getElementById('history-table');
  const bodyEl = document.getElementById('history-body');

  if (!data || data.length === 0) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    if (tableEl) tableEl.classList.add('hidden');
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');
  if (tableEl) tableEl.classList.remove('hidden');

  bodyEl.innerHTML = data.map(r => {
    const date = new Date(r.redeemed_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const tier = r.reward_tier || '–';
    const tierConfig = TIER_CONFIG[tier];
    const badgeStyle = tierConfig
      ? `background: ${tierConfig.badgeColor}15; color: ${tierConfig.badgeColor}; border: 1px solid ${tierConfig.badgeColor}30;`
      : 'background: rgba(107,114,128,0.1); color: #6b7280;';

    return `
      <tr>
        <td><span class="history-tier-badge" style="${badgeStyle}">Tier ${tier}</span></td>
        <td>${r.reward_name}</td>
        <td>-${r.reward_cost}</td>
        <td class="coupon-cell">${r.coupon_code}</td>
        <td>${date}</td>
      </tr>
    `;
  }).join('');
}

// ─── Modal ───
function setupModal() {
  document.getElementById('modal-close-btn')?.addEventListener('click', () => {
    document.getElementById('redeem-modal')?.classList.add('hidden');
  });

  document.getElementById('redeem-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'redeem-modal') {
      e.target.classList.add('hidden');
    }
  });
}

function showRedeemModal(reward, couponCode) {
  const tierConfig = TIER_CONFIG[reward.tier];
  const icon = SVG_ICONS[reward.iconKey] || SVG_ICONS.gift;

  const modalNameEl = document.getElementById('modal-reward-name');
  modalNameEl.innerHTML = `<span class="modal-reward-icon">${icon}</span> ${reward.name}`;

  const tierBadgeEl = document.getElementById('modal-tier-badge');
  if (tierBadgeEl) {
    tierBadgeEl.innerHTML = `<span class="reward-tier-badge" style="background: ${tierConfig.badgeColor}15; color: ${tierConfig.badgeColor}; border: 1px solid ${tierConfig.badgeColor}30;">
      ${tierConfig.icon} Tier ${reward.tier} — ${tierConfig.name}
    </span>`;
  }

  document.getElementById('modal-coupon-code').textContent = couponCode;
  document.getElementById('redeem-modal')?.classList.remove('hidden');
}
