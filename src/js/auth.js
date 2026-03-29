// ═══════════════════════════════════════════════════════════
// CIVIC LENS — Auth Page Logic
// ═══════════════════════════════════════════════════════════

import { supabase, signIn, signUp } from './supabase.js';
import { showToast } from './notifications.js';

const authForm = document.getElementById('auth-form');
const toggleBtn = document.getElementById('toggle-btn');
const toggleMsg = document.getElementById('toggle-msg');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const nameWrapper = document.getElementById('name-wrapper');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const btnArrow = document.getElementById('btn-arrow');
const btnSpinner = document.getElementById('btn-spinner');

let isLogin = true;

// ─── Toggle between Login and Signup ───
toggleBtn.addEventListener('click', () => {
  isLogin = !isLogin;

  if (isLogin) {
    nameWrapper.classList.remove('show');
    authTitle.textContent = 'Welcome Back';
    authSubtitle.textContent = 'Enter your credentials to access CivicLens.';
    btnText.textContent = 'Sign In';
    toggleMsg.textContent = "Don't have an account?";
    toggleBtn.textContent = 'Create one';
  } else {
    nameWrapper.classList.add('show');
    authTitle.textContent = 'Create Account';
    authSubtitle.textContent = 'Join CivicLens and start making a difference.';
    btnText.textContent = 'Sign Up';
    toggleMsg.textContent = 'Already have an account?';
    toggleBtn.textContent = 'Sign In';
  }
});

// ─── Form Submit ───
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const fullName = document.getElementById('full-name').value.trim();

  if (!email || !password) {
    showToast('Please fill in all fields.', 'error');
    return;
  }

  // Loading state
  submitBtn.disabled = true;
  btnText.textContent = isLogin ? 'Signing in...' : 'Creating account...';
  btnArrow.classList.add('hidden');
  btnSpinner.classList.remove('hidden');

  // Safety: auto-reset after 10 seconds if something hangs
  const safetyTimeout = setTimeout(() => {
    resetButton();
    showToast('Request timed out. Please try again.', 'error');
  }, 10000);

  try {
    if (isLogin) {
      const data = await signIn(email, password);
      clearTimeout(safetyTimeout);
      if (data?.session) {
        showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
      } else {
        showToast('Login failed. Please check your credentials.', 'error');
        resetButton();
      }
    } else {
      if (!fullName) {
        clearTimeout(safetyTimeout);
        throw new Error('Please enter your full name.');
      }
      const data = await signUp(email, password, fullName);
      clearTimeout(safetyTimeout);

      // If email confirmation is disabled, Supabase auto-signs in the user
      if (data?.session) {
        showToast('Account created! Redirecting...', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
      } else {
        showToast('Account created! Please sign in.', 'success');
        resetButton();
        toggleBtn.click();
      }
    }
  } catch (err) {
    clearTimeout(safetyTimeout);
    console.error('Auth error:', err);
    showToast(err.message || 'Something went wrong.', 'error');
    resetButton();
  }
});

function resetButton() {
  submitBtn.disabled = false;
  btnText.textContent = isLogin ? 'Sign In' : 'Sign Up';
  btnArrow.classList.remove('hidden');
  btnSpinner.classList.add('hidden');
}

// ─── Check URL params for mode ───
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'signup') {
    toggleBtn.click();
  }
});

// ═══════════════════════════════════════════════════════════
// LIVE STATS — Fetch real data from Supabase for auth panel
// ═══════════════════════════════════════════════════════════

async function loadLiveStats() {
  try {
    // 1. Issues Resolved — count complaints with status 'Resolved'
    const { count: resolvedCount } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Resolved');

    // 2. Active Citizens — count profiles with role 'citizen'
    const { count: citizenCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'citizen');

    // 3. Total Credits Awarded — sum all credits across profiles
    const { data: creditRows } = await supabase
      .from('profiles')
      .select('credits');

    const totalCredits = creditRows
      ? creditRows.reduce((sum, row) => sum + (row.credits || 0), 0)
      : 0;

    // Animate the counters
    animateStatCounter('stat-resolved-count', resolvedCount || 0);
    animateStatCounter('stat-citizens-count', citizenCount || 0);
    animateStatCounter('stat-credits-count', totalCredits);

  } catch (err) {
    console.warn('Could not load live stats:', err);
    // Silently fail — stats will just show "—"
  }
}

function animateStatCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el || target === 0) {
    if (el) el.textContent = '0';
    return;
  }

  let current = 0;
  const duration = 1500;
  const steps = 50;
  const increment = target / steps;
  const stepTime = duration / steps;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.round(current).toLocaleString('en-IN');
  }, stepTime);
}

// Fire stats fetch on load (non-blocking, doesn't affect auth flow)
loadLiveStats();
