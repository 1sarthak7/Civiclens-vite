// ═══════════════════════════════════════════════════════════
// CIVIC LENS — Toast Notification System
// ═══════════════════════════════════════════════════════════

const ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Show a toast notification.
 * @param {string} message - The message to display
 * @param {'success'|'error'|'warning'|'info'} type - Toast type
 * @param {number} duration - Duration in ms (default 4000)
 */
export function showToast(message, type = 'info', duration = 4000) {
  const box = getContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${ICONS[type] || ICONS.info}</span>
    <span>${message}</span>
  `;

  box.appendChild(toast);

  // Auto-dismiss
  setTimeout(() => {
    toast.classList.add('toast-dismiss');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}
