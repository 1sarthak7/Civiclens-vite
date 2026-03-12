// ═══════════════════════════════════════════════════════════
// CIVIC LENS — Auth Page Logic
// ═══════════════════════════════════════════════════════════

import { signIn, signUp } from './supabase.js';
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
