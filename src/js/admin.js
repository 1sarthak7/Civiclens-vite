// ═══════════════════════════════════════════════════════════
// CIVIC LENS — Admin Analytics Logic
// ═══════════════════════════════════════════════════════════

import { Chart, registerables } from 'chart.js';
import { supabase, getCurrentUser, signOut } from './supabase.js';
import { showToast } from './notifications.js';

Chart.register(...registerables);

// ─── Chart.js Dark Theme Defaults ───
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.06)';
Chart.defaults.font.family = "'Inter', sans-serif";

// ─── Init ───
document.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser();
  if (!user || user.role !== 'authority') {
    window.location.href = 'dashboard.html';
    return;
  }

  await loadAnalytics();

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await signOut();
    window.location.href = 'index.html';
  });
});

async function loadAnalytics() {
  const { data: complaints, error } = await supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    showToast('Failed to load analytics', 'error');
    return;
  }

  const all = complaints || [];

  // ─── Top Stats ───
  const total = all.length;
  const pending = all.filter(c => c.status === 'Pending').length;
  const resolved = all.filter(c => c.status === 'Resolved').length;
  const rate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;

  document.getElementById('total-reports').textContent = total;
  document.getElementById('total-pending').textContent = pending;
  document.getElementById('total-resolved').textContent = resolved;
  document.getElementById('resolution-rate').textContent = `${rate}%`;

  // ─── Category Chart (Doughnut) ───
  const categories = {};
  all.forEach(c => {
    categories[c.category] = (categories[c.category] || 0) + 1;
  });

  const categoryColors = {
    Roads: '#f59e0b',
    Garbage: '#10b981',
    Water: '#1C4D8D',
    Streetlight: '#f43f5e',
    Drainage: '#8b5cf6',
    Other: '#64748b',
  };

  new Chart(document.getElementById('category-chart'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories),
        backgroundColor: Object.keys(categories).map(k => categoryColors[k] || '#64748b'),
        borderColor: '#111827',
        borderWidth: 3,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
            font: { size: 11 },
          },
        },
      },
      cutout: '65%',
    },
  });

  // ─── Status Chart (Bar) ───
  const statuses = { Pending: 0, 'In Progress': 0, 'Awaiting Confirmation': 0, Resolved: 0 };
  all.forEach(c => {
    if (statuses[c.status] !== undefined) statuses[c.status]++;
  });

  const statusColors = {
    Pending: '#f59e0b',
    'In Progress': '#1C4D8D',
    'Awaiting Confirmation': '#8b5cf6',
    Resolved: '#10b981',
  };

  new Chart(document.getElementById('status-chart'), {
    type: 'bar',
    data: {
      labels: Object.keys(statuses),
      datasets: [{
        label: 'Complaints',
        data: Object.values(statuses),
        backgroundColor: Object.keys(statuses).map(k => statusColors[k]),
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 40,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, font: { size: 11 } },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
        x: {
          ticks: { font: { size: 10 } },
          grid: { display: false },
        },
      },
    },
  });

  // ─── Recent Table ───
  const tbody = document.getElementById('recent-tbody');
  tbody.innerHTML = '';

  const recent = all.slice(0, 15);

  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-dim);padding:40px;">No complaints yet.</td></tr>';
    return;
  }

  recent.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${getCategoryEmoji(c.category)} ${c.category}</strong></td>
      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.description}</td>
      <td><span class="badge badge-${getStatusClass(c.status)}">${c.status}</span></td>
      <td style="white-space:nowrap;">${new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
    `;
    tbody.appendChild(tr);
  });
}

function getStatusClass(status) {
  const map = { Pending: 'pending', 'In Progress': 'progress', 'Awaiting Confirmation': 'awaiting', Resolved: 'resolved' };
  return map[status] || 'pending';
}

function getCategoryEmoji(category) {
  const emojis = { Roads: '🚧', Garbage: '🗑️', Water: '💧', Streetlight: '💡', Drainage: '🌊', Other: '📋' };
  return emojis[category] || '📍';
}
