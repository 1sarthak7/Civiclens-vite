// ═══════════════════════════════════════════════════════════
// CIVIC LENS — Rewards Page Logic
// ═══════════════════════════════════════════════════════════

import { supabase, getCurrentUser } from './supabase.js';
import { showToast } from './notifications.js';

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
  gas: `<svg class="reward-svg reward-svg--gas" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="10" y="12" width="20" height="30" rx="4" class="svg-cylinder"/>
    <ellipse cx="20" cy="12" rx="10" ry="4" class="svg-cap"/>
    <path d="M30 20h6a2 2 0 012 2v8a2 2 0 01-2 2h-4" class="svg-nozzle"/>
    <path d="M36 18V10a2 2 0 012-2h2" class="svg-pipe"/>
    <circle cx="40" cy="6" r="2" class="svg-flame"/>
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
  // Utility icons
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

// ─── Reward Catalog ───
const REWARDS = [
  {
    id: 'metro',
    icon: SVG_ICONS.metro,
    name: 'Metro Discount',
    desc: '₹50 off your next metro recharge. Valid at any metro station counter.',
    cost: 100,
  },
  {
    id: 'electricity',
    icon: SVG_ICONS.electricity,
    name: 'Electricity Bill Discount',
    desc: '₹100 off your next electricity bill payment via the official portal.',
    cost: 200,
  },
  {
    id: 'water',
    icon: SVG_ICONS.water,
    name: 'Water Bill Discount',
    desc: '₹75 off your next water utility bill. Apply at municipal office.',
    cost: 150,
  },
  {
    id: 'gas',
    icon: SVG_ICONS.gas,
    name: 'Gas Cylinder Discount',
    desc: '₹125 off your next gas cylinder booking through authorized dealers.',
    cost: 250,
  },
  {
    id: 'parking',
    icon: SVG_ICONS.parking,
    name: 'Free Parking Pass',
    desc: 'One-day free municipal parking pass. Valid at any city parking zone.',
    cost: 75,
  },
  {
    id: 'museum',
    icon: SVG_ICONS.museum,
    name: 'Museum Entry Pass',
    desc: 'Free entry to any government museum in your city for one visit.',
    cost: 50,
  },
];

let currentUser = null;
let userCredits = 0;
let creditsPerResolved = 50;

// ─── Init ───
document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await getCurrentUser();
  if (!currentUser) {
    window.location.href = 'auth.html';
    return;
  }

  setupUserInfo();
  await loadRewardConfig();

  if (currentUser.role === 'authority') {
    // Admin view
    document.getElementById('citizen-rewards-view')?.classList.add('hidden');
    document.getElementById('admin-rewards-view')?.classList.remove('hidden');
    await loadAdminView();
  } else {
    // Citizen view
    document.getElementById('citizen-rewards-view')?.classList.remove('hidden');
    document.getElementById('admin-rewards-view')?.classList.add('hidden');
    await loadCredits();
    renderRewards();
    await loadHistory();
    setupModal();
  }
});

// ─── Load Reward Config ───
async function loadRewardConfig() {
  try {
    const { data } = await supabase
      .from('reward_config')
      .select('credits_per_resolved')
      .eq('id', 1)
      .single();

    if (data) {
      creditsPerResolved = data.credits_per_resolved;
      // Update citizen subtext
      const subtext = document.getElementById('credit-subtext');
      if (subtext) subtext.textContent = `Earn ${creditsPerResolved} credits per resolved complaint`;
    }
  } catch (err) {
    console.warn('reward_config not found, using default:', creditsPerResolved);
  }
}

// ═══ ADMIN VIEW ═══

async function loadAdminView() {
  // Load config into input
  const configInput = document.getElementById('credits-per-resolved');
  const configPreview = document.getElementById('current-config-value');
  if (configInput) configInput.value = creditsPerResolved;
  if (configPreview) configPreview.textContent = creditsPerResolved;

  // Save config button
  document.getElementById('save-config-btn')?.addEventListener('click', saveRewardConfig);

  // Load users
  await loadAllUsers();
}

async function saveRewardConfig() {
  const input = document.getElementById('credits-per-resolved');
  const newValue = parseInt(input?.value, 10);

  if (!newValue || newValue < 1 || newValue > 1000) {
    showToast('Please enter a value between 1 and 1000', 'error');
    return;
  }

  const btn = document.getElementById('save-config-btn');
  if (btn) btn.disabled = true;

  const { error } = await supabase
    .from('reward_config')
    .update({ credits_per_resolved: newValue, updated_at: new Date().toISOString() })
    .eq('id', 1);

  if (error) {
    console.error('Config save error:', error);
    showToast('Failed to save — have you run the SQL setup?', 'error');
  } else {
    creditsPerResolved = newValue;
    const preview = document.getElementById('current-config-value');
    if (preview) preview.textContent = newValue;
    showToast(`Credits per resolved set to ${newValue}`, 'success');
  }

  if (btn) btn.disabled = false;
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

  // Attach save handlers
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
        // Try RPC as fallback
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

  // Count resolved complaints for this user
  const { count } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id)
    .eq('status', 'Resolved');

  // Sum total redeemed
  const { data: redemptions } = await supabase
    .from('redemptions')
    .select('reward_cost')
    .eq('user_id', currentUser.id);

  const totalRedeemed = redemptions ? redemptions.reduce((sum, r) => sum + r.reward_cost, 0) : 0;
  const totalEarned = userCredits + totalRedeemed;

  // Update UI
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

// ─── Render Reward Cards ───
function renderRewards() {
  const grid = document.getElementById('rewards-grid');
  if (!grid) return;

  grid.innerHTML = REWARDS.map(reward => `
    <div class="reward-card" data-reward-id="${reward.id}">
      <div class="reward-card-icon">${reward.icon}</div>
      <div class="reward-card-name">${reward.name}</div>
      <div class="reward-card-desc">${reward.desc}</div>
      <div class="reward-card-footer">
        <div class="reward-cost">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
          ${reward.cost} credits
        </div>
        <button class="redeem-btn" data-id="${reward.id}" ${userCredits < reward.cost ? 'disabled' : ''}>
          ${userCredits < reward.cost ? 'Not Enough' : 'Redeem'}
        </button>
      </div>
    </div>
  `).join('');

  // Attach click handlers
  grid.querySelectorAll('.redeem-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => handleRedeem(btn.dataset.id));
  });
}

// ─── Handle Redemption ───
async function handleRedeem(rewardId) {
  const reward = REWARDS.find(r => r.id === rewardId);
  if (!reward) return;

  if (userCredits < reward.cost) {
    showToast('Not enough credits!', 'error');
    return;
  }

  // Generate coupon code
  const couponCode = generateCoupon(reward.id);

  try {
    // Deduct credits
    const newCredits = userCredits - reward.cost;
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', currentUser.id);

    if (creditError) throw creditError;

    // Record redemption
    const { error: redeemError } = await supabase
      .from('redemptions')
      .insert({
        user_id: currentUser.id,
        reward_name: reward.name,
        reward_cost: reward.cost,
        coupon_code: couponCode,
      });

    if (redeemError) throw redeemError;

    // Update local state
    userCredits = newCredits;

    // Show success modal
    showRedeemModal(reward, couponCode);

    // Refresh UI
    document.getElementById('credit-balance').textContent = userCredits;
    renderRewards();
    await loadHistory();
    await loadCredits();

  } catch (err) {
    console.error('Redemption error:', err);
    showToast(err.message || 'Redemption failed', 'error');
  }
}

// ─── Generate Coupon Code ───
function generateCoupon(rewardId) {
  const prefix = rewardId.toUpperCase().substring(0, 3);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CL-${prefix}-${random}`;
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

    return `
      <tr>
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
  const modalNameEl = document.getElementById('modal-reward-name');
  modalNameEl.innerHTML = `<span class="modal-reward-icon">${reward.icon}</span> ${reward.name}`;
  document.getElementById('modal-coupon-code').textContent = couponCode;
  document.getElementById('redeem-modal')?.classList.remove('hidden');
}
