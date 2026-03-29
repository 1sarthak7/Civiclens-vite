// ═══════════════════════════════════════════════════════════
// CIVIC LENS — Dashboard Logic (v2 — Voting + Reject/Duplicate)
// ═══════════════════════════════════════════════════════════

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { supabase, getCurrentUser, signOut } from './supabase.js';
import { showToast } from './notifications.js';
import { calculateReward, SEVERITY_OPTIONS } from './rewardAlgorithm.js';

// ─── State ───
let map;
let selectionMarker = null;
let selectedLat = null;
let selectedLng = null;
let currentUser = null;
let heatmapLayer = null;
let heatmapActive = false;
let markersLayer = null;
let userVotes = {};       // { complaintId: 'up' | 'down' }
let allComplaints = [];   // cached for duplicate search

// ─── Custom SVG Markers ───
function createSvgIcon(color, pulseColor) {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position:relative;width:32px;height:42px;">
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="${color}" opacity="0.9"/>
          <circle cx="16" cy="16" r="7" fill="white" opacity="0.9"/>
          <circle cx="16" cy="16" r="4" fill="${color}"/>
        </svg>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -40],
  });
}

const icons = {
  Pending:                createSvgIcon('#f59e0b', '#fbbf24'),
  'In Progress':          createSvgIcon('#1C4D8D', '#4988C4'),
  'Awaiting Confirmation': createSvgIcon('#8b5cf6', '#a78bfa'),
  Resolved:               createSvgIcon('#059669', '#34d399'),
  Rejected:               createSvgIcon('#dc2626', '#f87171'),
  Default:                createSvgIcon('#1C4D8D', '#4988C4'),
};

// ─── Init ───
document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await getCurrentUser();
  if (!currentUser) {
    window.location.href = 'auth.html';
    return;
  }

  setupProfile();
  setupRoleViews();
  initMap();
  await loadUserVotes();
  await loadComplaints();
  await loadUserCredits();
  setupEventListeners();
});

// ─── Profile ───
function setupProfile() {
  const nameEl = document.getElementById('user-name');
  const roleEl = document.getElementById('user-role');
  const avatarEl = document.getElementById('user-avatar');

  const name = currentUser.full_name || 'User';
  if (nameEl) nameEl.textContent = name;
  if (roleEl) {
    roleEl.textContent = (currentUser.role || 'citizen').toUpperCase();
    if (currentUser.role === 'authority') roleEl.classList.add('authority');
  }
  if (avatarEl) {
    avatarEl.textContent = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}

// ─── Role Views ───
function setupRoleViews() {
  const adminNav = document.getElementById('nav-admin');
  const analyticsNav = document.getElementById('nav-analytics');

  if (currentUser.role === 'authority') {
    if (adminNav) adminNav.classList.remove('hidden');
    if (analyticsNav) analyticsNav.classList.remove('hidden');
  }
}

// ─── Map ───
function initMap() {
  map = L.map('map', {
    zoomControl: false,
  }).setView([18.5204, 73.8567], 13);

  // Zoom control on bottom-right
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Light tile layer — CartoDB Voyager
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OSM</a>',
  }).addTo(map);

  // Markers layer group
  markersLayer = L.layerGroup().addTo(map);

  // Click to report (citizens only)
  if (currentUser.role !== 'authority') {
    map.on('click', (e) => {
      placeSelectionMarker(e.latlng);
    });
  }
}

function placeSelectionMarker(latlng) {
  if (selectionMarker) map.removeLayer(selectionMarker);

  selectionMarker = L.marker([latlng.lat, latlng.lng], {
    icon: icons.Default,
  }).addTo(map);

  map.panTo(latlng);
  selectedLat = latlng.lat;
  selectedLng = latlng.lng;

  // Show report form
  const form = document.getElementById('report-form-container');
  const coords = document.getElementById('coords-display');
  if (form) form.classList.remove('hidden');
  if (coords) coords.textContent = `Lat: ${latlng.lat.toFixed(5)}, Lng: ${latlng.lng.toFixed(5)}`;
}

// ═══════════════════════════════════════════════════════════
// VOTING SYSTEM
// ═══════════════════════════════════════════════════════════

async function loadUserVotes() {
  if (!currentUser) return;
  const { data } = await supabase
    .from('complaint_votes')
    .select('complaint_id, vote_type')
    .eq('user_id', currentUser.id);

  userVotes = {};
  if (data) {
    data.forEach(v => { userVotes[v.complaint_id] = v.vote_type; });
  }
}

async function handleVote(complaintId, voteType) {
  if (!currentUser) return;

  const existing = userVotes[complaintId];

  try {
    if (existing === voteType) {
      // Toggle off — remove vote
      await supabase
        .from('complaint_votes')
        .delete()
        .eq('complaint_id', complaintId)
        .eq('user_id', currentUser.id);

      delete userVotes[complaintId];
    } else if (existing) {
      // Switch vote
      await supabase
        .from('complaint_votes')
        .update({ vote_type: voteType })
        .eq('complaint_id', complaintId)
        .eq('user_id', currentUser.id);

      userVotes[complaintId] = voteType;
    } else {
      // New vote
      await supabase
        .from('complaint_votes')
        .insert({
          complaint_id: complaintId,
          user_id: currentUser.id,
          vote_type: voteType,
        });

      userVotes[complaintId] = voteType;
    }

    // Recalculate & update cached counts
    await syncVoteCounts(complaintId);

    // Re-render to reflect new vote state
    await loadComplaints(getCurrentFilter());
  } catch (err) {
    console.error('Vote error:', err);
    showToast('Failed to register vote', 'error');
  }
}

async function syncVoteCounts(complaintId) {
  const { count: upCount } = await supabase
    .from('complaint_votes')
    .select('*', { count: 'exact', head: true })
    .eq('complaint_id', complaintId)
    .eq('vote_type', 'up');

  const { count: downCount } = await supabase
    .from('complaint_votes')
    .select('*', { count: 'exact', head: true })
    .eq('complaint_id', complaintId)
    .eq('vote_type', 'down');

  await supabase
    .from('complaints')
    .update({ upvotes: upCount || 0, downvotes: downCount || 0 })
    .eq('id', complaintId);
}

function getCurrentFilter() {
  const activeNav = document.querySelector('.nav-item.active');
  return activeNav?.dataset.filter || 'default';
}

function renderVoteBar(issue) {
  const isOwn = issue.user_id === currentUser.id;
  const currentVote = userVotes[issue.id];
  const upActive = currentVote === 'up' ? 'active' : '';
  const downActive = currentVote === 'down' ? 'active' : '';
  const disabled = isOwn ? 'disabled' : '';
  const title = isOwn ? 'title="Cannot vote on own complaint"' : '';

  return `
    <div class="vote-bar">
      <button class="vote-btn vote-btn--up ${upActive}" data-id="${issue.id}" data-vote="up" ${disabled} ${title}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
        <span class="vote-count">${issue.upvotes || 0}</span>
      </button>
      <span class="vote-separator"></span>
      <button class="vote-btn vote-btn--down ${downActive}" data-id="${issue.id}" data-vote="down" ${disabled} ${title}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        <span class="vote-count">${issue.downvotes || 0}</span>
      </button>
    </div>
  `;
}

function renderDetailVoteBar(issue) {
  const isOwn = issue.user_id === currentUser.id;
  const currentVote = userVotes[issue.id];
  const upActive = currentVote === 'up' ? 'active' : '';
  const downActive = currentVote === 'down' ? 'active' : '';
  const disabled = isOwn ? 'disabled' : '';
  const ups = issue.upvotes || 0;

  let summary = '';
  if (ups > 0) {
    summary = `<span class="detail-vote-summary">${ups} citizen${ups > 1 ? 's' : ''} also face${ups === 1 ? 's' : ''} this issue</span>`;
  }

  return `
    <div class="detail-vote-bar" id="detail-vote-bar">
      <button class="detail-vote-btn detail-vote-btn--up ${upActive}" data-id="${issue.id}" data-vote="up" ${disabled}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
        Upvote (${ups})
      </button>
      <button class="detail-vote-btn detail-vote-btn--down ${downActive}" data-id="${issue.id}" data-vote="down" ${disabled}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        Downvote (${issue.downvotes || 0})
      </button>
      ${summary}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// REJECT / DUPLICATE SYSTEM
// ═══════════════════════════════════════════════════════════

function renderRejectPanel(issue) {
  return `
    <div class="reject-panel" id="reject-panel-${issue.id}">
      <div class="reject-panel-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        Reject Complaint
      </div>
      <div class="reject-field">
        <label>Reason</label>
        <select class="reject-reason-select" data-id="${issue.id}">
          <option value="" disabled selected>Select reason</option>
          <option value="Duplicate">Duplicate complaint</option>
          <option value="Invalid">Invalid / False report</option>
          <option value="Out of jurisdiction">Out of jurisdiction</option>
          <option value="Insufficient info">Insufficient information</option>
          <option value="custom">Custom reason...</option>
        </select>
      </div>
      <div class="reject-field reject-custom-field hidden" id="reject-custom-${issue.id}">
        <label>Custom Reason</label>
        <textarea class="reject-custom-text" data-id="${issue.id}" placeholder="Type your reason..."></textarea>
      </div>
      <div class="reject-field reject-dup-field hidden" id="reject-dup-${issue.id}">
        <label>Link to Original Complaint</label>
        <input type="text" class="reject-dup-search" data-id="${issue.id}" placeholder="Search by category or description..." />
        <div class="dup-search-results" id="dup-results-${issue.id}"></div>
        <div class="dup-selected hidden" id="dup-selected-${issue.id}">
          <span class="dup-selected-text"></span>
          <button class="dup-selected-clear" data-id="${issue.id}">×</button>
        </div>
      </div>
      <div class="reject-actions">
        <button class="btn-danger-outline reject-confirm-btn" data-id="${issue.id}">Confirm Rejection</button>
        <button class="btn btn-ghost btn-sm reject-cancel-btn" data-id="${issue.id}">Cancel</button>
      </div>
    </div>
  `;
}

async function handleReject(complaintId) {
  const panel = document.getElementById(`reject-panel-${complaintId}`);
  if (!panel) return;

  const reasonSelect = panel.querySelector('.reject-reason-select');
  const customText = panel.querySelector('.reject-custom-text');
  let reason = reasonSelect.value;

  if (!reason) {
    showToast('Please select a rejection reason', 'error');
    return;
  }

  if (reason === 'custom') {
    reason = customText?.value?.trim();
    if (!reason) {
      showToast('Please type a custom reason', 'error');
      return;
    }
  }

  // Get duplicate link if selected
  const dupSelected = document.getElementById(`dup-selected-${complaintId}`);
  const dupId = dupSelected?.dataset.linkedId || null;

  const updatePayload = {
    status: 'Rejected',
    rejection_reason: reason,
    is_duplicate: reason === 'Duplicate',
    updated_at: new Date().toISOString(),
  };

  if (dupId) {
    updatePayload.duplicate_of = dupId;
    updatePayload.is_duplicate = true;
  }

  const { error } = await supabase
    .from('complaints')
    .update(updatePayload)
    .eq('id', complaintId);

  if (error) {
    showToast('Failed to reject complaint', 'error');
    console.error(error);
  } else {
    showToast(`Complaint rejected: ${reason}`, 'success');
    closeDetailModal();
    await loadComplaints(getCurrentFilter());
  }
}

function setupDuplicateSearch(complaintId) {
  const input = document.querySelector(`.reject-dup-search[data-id="${complaintId}"]`);
  const resultsContainer = document.getElementById(`dup-results-${complaintId}`);
  const selectedContainer = document.getElementById(`dup-selected-${complaintId}`);
  if (!input || !resultsContainer) return;

  let debounceTimer = null;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = input.value.trim().toLowerCase();

    if (!query) {
      resultsContainer.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(() => {
      const matches = allComplaints.filter(c =>
        c.id !== complaintId &&
        c.status !== 'Rejected' &&
        (c.category.toLowerCase().includes(query) || c.description.toLowerCase().includes(query))
      ).slice(0, 5);

      if (matches.length === 0) {
        resultsContainer.innerHTML = '<div class="dup-search-item"><span class="dup-item-desc">No matches found</span></div>';
        return;
      }

      resultsContainer.innerHTML = matches.map(c => `
        <div class="dup-search-item" data-dup-id="${c.id}">
          <span class="dup-item-cat">${c.category} — ${formatDate(c.created_at)}</span>
          <span class="dup-item-desc">${c.description}</span>
        </div>
      `).join('');

      // Click to select
      resultsContainer.querySelectorAll('.dup-search-item[data-dup-id]').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.dataset.dupId;
          const cat = item.querySelector('.dup-item-cat').textContent;

          selectedContainer.classList.remove('hidden');
          selectedContainer.dataset.linkedId = id;
          selectedContainer.querySelector('.dup-selected-text').textContent = `Linked: ${cat}`;

          resultsContainer.innerHTML = '';
          input.value = '';
        });
      });
    }, 300);
  });
}

// ─── Load Complaints ───
async function loadComplaints(filterMode = 'default') {
  const listContainer = document.getElementById('complaints-list');
  if (listContainer) listContainer.innerHTML = '<div class="feed-loading">Loading updates...</div>';

  let query = supabase.from('complaints').select('*').order('created_at', { ascending: false });

  if (filterMode === 'mine') {
    query = query.eq('user_id', currentUser.id);
  }

  const { data: complaints, error } = await query;
  if (error) {
    console.error('Error loading complaints:', error);
    showToast('Failed to load complaints', 'error');
    return;
  }

  allComplaints = complaints || [];
  updateStats(allComplaints);
  renderComplaints(allComplaints);
}

// ─── Render ───
function renderComplaints(complaints) {
  const listContainer = document.getElementById('complaints-list');
  listContainer.innerHTML = '';

  // Clear map markers
  markersLayer.clearLayers();

  if (complaints.length === 0) {
    listContainer.innerHTML = '<div class="feed-empty">No reports found.<br/>Click on the map to report an issue.</div>';
    return;
  }

  const heatPoints = [];

  complaints.forEach((issue, index) => {
    // Map marker
    const icon = icons[issue.status] || icons.Default;
    const marker = L.marker([issue.lat, issue.lng], { icon }).addTo(markersLayer);

    // Popup content
    let popupHtml = `
      <div class="popup-content">
        <span class="badge badge-${getStatusClass(issue.status)}">${issue.status}</span>
        <h4>${issue.category}</h4>
        <p>${issue.description}</p>
        ${issue.image_url ? `<img src="${issue.image_url}" alt="Evidence" />` : ''}
      </div>
    `;
    marker.bindPopup(popupHtml);

    // Heatmap data
    heatPoints.push([issue.lat, issue.lng, 0.5]);

    // Sidebar card
    const card = document.createElement('div');
    card.className = `complaint-card${issue.status === 'Rejected' ? ' complaint-card--rejected' : ''}`;
    card.style.animationDelay = `${index * 0.05}s`;
    card.innerHTML = `
      <div class="cc-header">
        <span class="badge badge-${getStatusClass(issue.status)}">${issue.status}</span>
        <small>${formatDate(issue.created_at)}</small>
      </div>
      <div class="cc-category">${getCategoryEmoji(issue.category)} ${issue.category}</div>
      <div class="cc-desc">${issue.description}</div>
      ${issue.image_url ? `<img class="cc-image-thumb" src="${issue.image_url}" alt="Evidence" />` : ''}
      ${renderRejectedInfo(issue)}
      ${renderVoteBar(issue)}
      ${renderActions(issue)}
    `;

    // Click card to open detail modal (stop if they clicked an action button/select)
    card.addEventListener('click', (e) => {
      if (e.target.closest('.cc-actions') || e.target.closest('select') || e.target.closest('button') || e.target.closest('.severity-pill') || e.target.closest('.vote-bar') || e.target.closest('.reject-panel')) return;
      openDetailModal(issue, marker);
    });

    listContainer.appendChild(card);
  });

  // Store heat points for toggle
  window._heatPoints = heatPoints;
}

function renderRejectedInfo(issue) {
  if (issue.status !== 'Rejected') return '';

  let html = '';
  if (issue.rejection_reason) {
    html += `
      <div class="cc-rejected-reason">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        ${issue.rejection_reason}
      </div>
    `;
  }
  if (issue.is_duplicate && issue.duplicate_of) {
    const original = allComplaints.find(c => c.id === issue.duplicate_of);
    if (original) {
      html += `
        <div class="cc-duplicate-link" data-dup-target="${issue.duplicate_of}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          Duplicate of: ${original.category} — ${formatDate(original.created_at)}
        </div>
      `;
    }
  }
  return html;
}

function renderActions(issue) {
  // No actions for rejected complaints
  if (issue.status === 'Rejected') return '';

  if (currentUser.role === 'citizen' && issue.status === 'Awaiting Confirmation') {
    return `
      <div class="cc-actions">
        <button class="btn btn-primary btn-sm btn-full confirm-btn" data-id="${issue.id}">
          Confirm Resolution
        </button>
      </div>
    `;
  }

  if (currentUser.role === 'authority' && issue.status !== 'Resolved') {
    const severityPills = SEVERITY_OPTIONS.map(s => `
      <label class="severity-pill" data-severity="${s.key}" title="${s.desc}">
        <input type="radio" name="severity-${issue.id}" value="${s.key}" ${issue.severity === s.key ? 'checked' : ''} />
        <span class="severity-pill-inner" style="--sev-color: ${s.color}">${s.icon} ${s.label}</span>
      </label>
    `).join('');

    return `
      <div class="cc-actions cc-actions--authority">
        <div class="severity-picker">
          <span class="severity-picker-label">Severity</span>
          <div class="severity-pills" data-complaint-id="${issue.id}">
            ${severityPills}
          </div>
        </div>
        <select class="status-select" data-id="${issue.id}">
          <option value="" disabled selected>Update Status</option>
          <option value="In Progress">In Progress</option>
          <option value="Awaiting Confirmation">Work Done</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">❌ Reject Complaint</option>
        </select>
      </div>
    `;
  }

  // Show severity badge on resolved complaints
  if (issue.severity && issue.status === 'Resolved') {
    const sev = SEVERITY_OPTIONS.find(s => s.key === issue.severity);
    if (sev) {
      return `<div class="cc-severity-badge" style="--sev-color: ${sev.color}">${sev.icon} ${sev.label} severity</div>`;
    }
  }

  return '';
}

// ─── Detail Modal ───
function openDetailModal(issue, marker) {
  const modal = document.getElementById('detail-modal');
  if (!modal) return;

  // Badge
  const badgeEl = document.getElementById('detail-badge');
  badgeEl.className = `badge badge-${getStatusClass(issue.status)}`;
  badgeEl.textContent = issue.status;

  // Date
  document.getElementById('detail-date').textContent = formatDate(issue.created_at);

  // Category
  document.getElementById('detail-category').textContent = `${getCategoryEmoji(issue.category)} ${issue.category}`;

  // Description — full text, no truncation
  document.getElementById('detail-description').textContent = issue.description;

  // Location
  document.getElementById('detail-location').textContent = `Lat: ${issue.lat.toFixed(5)}, Lng: ${issue.lng.toFixed(5)}`;

  // Image
  const imgSection = document.getElementById('detail-image-section');
  const imgEl = document.getElementById('detail-image');
  if (issue.image_url) {
    imgEl.src = issue.image_url;
    imgSection.classList.remove('hidden');
  } else {
    imgSection.classList.add('hidden');
  }

  // Severity display
  const sevDisplay = document.getElementById('detail-severity-display');
  const sevText = document.getElementById('detail-severity-text');
  if (issue.severity) {
    const sev = SEVERITY_OPTIONS.find(s => s.key === issue.severity);
    if (sev) {
      sevText.textContent = `${sev.label} severity`;
      sevDisplay.classList.remove('hidden');
    } else {
      sevDisplay.classList.add('hidden');
    }
  } else {
    sevDisplay.classList.add('hidden');
  }

  // Vote bar in modal
  const voteContainer = document.getElementById('detail-vote-container');
  if (voteContainer) {
    voteContainer.innerHTML = renderDetailVoteBar(issue);
  }

  // Rejected info in modal
  const rejectedContainer = document.getElementById('detail-rejected-info');
  if (rejectedContainer) {
    rejectedContainer.innerHTML = renderRejectedInfo(issue);
  }

  // Actions
  const actionsContainer = document.getElementById('detail-actions');
  actionsContainer.innerHTML = renderDetailActions(issue);

  // View on Map button
  const locateBtn = document.getElementById('detail-locate-btn');
  locateBtn.onclick = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    map.flyTo([issue.lat, issue.lng], 16);
    if (marker) marker.openPopup();
  };

  // Show modal
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  const modal = document.getElementById('detail-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function renderDetailActions(issue) {
  if (issue.status === 'Rejected') return '';

  if (currentUser.role === 'citizen' && issue.status === 'Awaiting Confirmation') {
    return `
      <button class="btn btn-primary btn-full detail-confirm-btn" data-id="${issue.id}">
        Confirm Resolution
      </button>
    `;
  }

  if (currentUser.role === 'authority' && issue.status !== 'Resolved') {
    const severityPills = SEVERITY_OPTIONS.map(s => `
      <label class="severity-pill" data-severity="${s.key}" title="${s.desc}">
        <input type="radio" name="detail-severity-${issue.id}" value="${s.key}" ${issue.severity === s.key ? 'checked' : ''} />
        <span class="severity-pill-inner" style="--sev-color: ${s.color}">${s.icon} ${s.label}</span>
      </label>
    `).join('');

    return `
      <div class="severity-picker">
        <span class="severity-picker-label">Severity</span>
        <div class="severity-pills" data-complaint-id="${issue.id}">
          ${severityPills}
        </div>
      </div>
      <select class="status-select detail-status-select" data-id="${issue.id}">
        <option value="" disabled selected>Update Status</option>
        <option value="In Progress">In Progress</option>
        <option value="Awaiting Confirmation">Work Done</option>
        <option value="Resolved">Resolved</option>
        <option value="Rejected">❌ Reject Complaint</option>
      </select>
      <div id="detail-reject-panel" class="hidden"></div>
    `;
  }

  if (issue.severity && issue.status === 'Resolved') {
    const sev = SEVERITY_OPTIONS.find(s => s.key === issue.severity);
    if (sev) {
      return `<div class="cc-severity-badge" style="--sev-color: ${sev.color}">${sev.icon} ${sev.label} severity</div>`;
    }
  }

  return '';
}

function updateStats(complaints) {
  const pending = complaints.filter(c => c.status === 'Pending').length;
  const progress = complaints.filter(c => c.status === 'In Progress' || c.status === 'Awaiting Confirmation').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;

  const pe = document.getElementById('stat-pending');
  const pr = document.getElementById('stat-progress');
  const re = document.getElementById('stat-resolved');

  if (pe) pe.textContent = pending;
  if (pr) pr.textContent = progress;
  if (re) re.textContent = resolved;
}

// ─── Event Listeners ───
function setupEventListeners() {
  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await signOut();
    window.location.href = 'index.html';
  });

  // Nav filter
  document.querySelectorAll('.nav-item[data-filter]').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      loadComplaints(item.dataset.filter);
    });
  });

  // Complaint form
  document.getElementById('complaint-form')?.addEventListener('submit', handleSubmitReport);

  // Cancel report
  document.getElementById('report-cancel-btn')?.addEventListener('click', () => {
    document.getElementById('report-form-container')?.classList.add('hidden');
    if (selectionMarker) {
      map.removeLayer(selectionMarker);
      selectionMarker = null;
    }
  });

  // Image preview
  document.getElementById('image-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('image-preview');
    if (file && preview) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        preview.src = ev.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  // Locate me
  document.getElementById('locate-btn')?.addEventListener('click', locateUser);

  // Heatmap toggle
  document.getElementById('heatmap-btn')?.addEventListener('click', toggleHeatmap);

  // ─── Animated Search Bar ───
  initSearchBar();

  // ═══ VOTING — Delegated click handlers ═══

  // Vote buttons on sidebar cards
  document.getElementById('complaints-list')?.addEventListener('click', async (e) => {
    const voteBtn = e.target.closest('.vote-btn');
    if (voteBtn && !voteBtn.disabled) {
      e.stopPropagation();
      const id = voteBtn.dataset.id;
      const voteType = voteBtn.dataset.vote;
      voteBtn.classList.add('bump');
      setTimeout(() => voteBtn.classList.remove('bump'), 300);
      await handleVote(id, voteType);
      return;
    }

    const btn = e.target.closest('.confirm-btn');
    if (btn) {
      await updateComplaintStatus(btn.dataset.id, 'Resolved');
    }

    // Duplicate link click
    const dupLink = e.target.closest('.cc-duplicate-link');
    if (dupLink) {
      const targetId = dupLink.dataset.dupTarget;
      const target = allComplaints.find(c => c.id === targetId);
      if (target) {
        const marker = markersLayer.getLayers().find(m => {
          const ll = m.getLatLng();
          return ll.lat === target.lat && ll.lng === target.lng;
        });
        openDetailModal(target, marker);
      }
    }
  });

  // Status updates (with reject handling)
  document.getElementById('complaints-list')?.addEventListener('change', async (e) => {
    if (e.target.classList.contains('status-select')) {
      const id = e.target.dataset.id;
      const newStatus = e.target.value;

      if (newStatus === 'Rejected') {
        // Show reject panel inline
        const panel = e.target.closest('.cc-actions');
        if (panel) {
          // Remove existing reject panel if any
          const existing = panel.querySelector('.reject-panel');
          if (existing) existing.remove();

          panel.insertAdjacentHTML('beforeend', renderRejectPanel({ id }));
          setupRejectPanelListeners(id);
          e.target.value = ''; // Reset select
        }
      } else {
        await updateComplaintStatus(id, newStatus);
      }
    }
  });

  // Detail modal: close
  document.getElementById('detail-modal-close')?.addEventListener('click', closeDetailModal);
  document.getElementById('detail-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDetailModal();
  });

  // Detail modal: vote buttons
  document.getElementById('detail-modal')?.addEventListener('click', async (e) => {
    const voteBtn = e.target.closest('.detail-vote-btn');
    if (voteBtn && !voteBtn.disabled) {
      const id = voteBtn.dataset.id;
      const voteType = voteBtn.dataset.vote;
      await handleVote(id, voteType);
      return;
    }
  });

  // Detail modal: delegated actions
  document.getElementById('detail-actions')?.addEventListener('change', async (e) => {
    if (e.target.classList.contains('detail-status-select')) {
      const id = e.target.dataset.id;
      const newStatus = e.target.value;

      if (newStatus === 'Rejected') {
        const panelContainer = document.getElementById('detail-reject-panel');
        if (panelContainer) {
          panelContainer.classList.remove('hidden');
          panelContainer.innerHTML = renderRejectPanel({ id });
          setupRejectPanelListeners(id);
        }
        e.target.value = '';
      } else {
        closeDetailModal();
        await updateComplaintStatus(id, newStatus);
      }
    }
  });

  document.getElementById('detail-actions')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.detail-confirm-btn');
    if (btn) {
      closeDetailModal();
      await updateComplaintStatus(btn.dataset.id, 'Resolved');
    }
  });

  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDetailModal();
  });
}

function setupRejectPanelListeners(complaintId) {
  const panel = document.getElementById(`reject-panel-${complaintId}`);
  if (!panel) return;

  // Reason select — show/hide custom & duplicate fields
  const reasonSelect = panel.querySelector('.reject-reason-select');
  reasonSelect?.addEventListener('change', (e) => {
    const val = e.target.value;
    const customField = document.getElementById(`reject-custom-${complaintId}`);
    const dupField = document.getElementById(`reject-dup-${complaintId}`);

    if (val === 'custom') {
      customField?.classList.remove('hidden');
    } else {
      customField?.classList.add('hidden');
    }

    if (val === 'Duplicate') {
      dupField?.classList.remove('hidden');
      setupDuplicateSearch(complaintId);
    } else {
      dupField?.classList.add('hidden');
    }
  });

  // Confirm rejection
  panel.querySelector('.reject-confirm-btn')?.addEventListener('click', () => {
    handleReject(complaintId);
  });

  // Cancel rejection
  panel.querySelector('.reject-cancel-btn')?.addEventListener('click', () => {
    panel.remove();
    // Also hide detail panel container if in modal
    const detailPanel = document.getElementById('detail-reject-panel');
    if (detailPanel) detailPanel.classList.add('hidden');
  });

  // Clear duplicate selection
  panel.querySelector('.dup-selected-clear')?.addEventListener('click', () => {
    const selected = document.getElementById(`dup-selected-${complaintId}`);
    if (selected) {
      selected.classList.add('hidden');
      delete selected.dataset.linkedId;
    }
  });
}

// ─── Submit Report ───
async function handleSubmitReport(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('report-submit-btn');
  const btnText = document.getElementById('report-btn-text');
  const spinner = document.getElementById('report-spinner');

  submitBtn.disabled = true;
  btnText.textContent = 'Submitting...';
  spinner.classList.remove('hidden');

  try {
    const category = document.getElementById('category').value;
    const description = document.getElementById('desc').value;
    const imageFile = document.getElementById('image-input').files[0];

    let imageUrl = null;

    // Upload image if selected
    if (imageFile) {
      const fileName = `${Date.now()}_${imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('complaint-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('complaint-images')
        .getPublicUrl(fileName);

      imageUrl = urlData.publicUrl;
    }

    // Insert complaint
    const { error } = await supabase.from('complaints').insert({
      user_id: currentUser.id,
      category,
      description,
      lat: selectedLat,
      lng: selectedLng,
      status: 'Pending',
      image_url: imageUrl,
    });

    if (error) throw error;

    showToast('Report submitted successfully!', 'success');

    // Reset form
    document.getElementById('complaint-form').reset();
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('report-form-container').classList.add('hidden');
    if (selectionMarker) {
      map.removeLayer(selectionMarker);
      selectionMarker = null;
    }

    await loadComplaints();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Failed to submit report', 'error');
  } finally {
    submitBtn.disabled = false;
    btnText.textContent = 'Submit';
    spinner.classList.add('hidden');
  }
}

// ─── Update Status ───
async function updateComplaintStatus(id, newStatus) {
  // If resolving, get the severity from the picker
  let severity = null;
  if (newStatus === 'Resolved' || newStatus === 'Awaiting Confirmation' || newStatus === 'In Progress') {
    const severityRadio = document.querySelector(`input[name="severity-${id}"]:checked`);
    severity = severityRadio?.value || null;
  }

  // Build the update payload
  const updatePayload = { status: newStatus, updated_at: new Date().toISOString() };
  if (severity) updatePayload.severity = severity;

  const { error } = await supabase
    .from('complaints')
    .update(updatePayload)
    .eq('id', id);

  if (error) {
    showToast('Failed to update status', 'error');
  } else {
    showToast(`Status updated to "${newStatus}"`, 'success');

    // Award credits when complaint is resolved (NOT rejected)
    if (newStatus === 'Resolved') {
      await awardCreditsWithAlgorithm(id);
    }

    await loadComplaints(getCurrentFilter());
    await loadUserCredits();
  }
}

// ─── Award Credits (Multi-Factor Algorithm) ───
async function awardCreditsWithAlgorithm(complaintId) {
  try {
    // Fetch the full complaint for algorithm inputs
    const { data: complaint, error: fetchErr } = await supabase
      .from('complaints')
      .select('user_id, severity, category, created_at, updated_at')
      .eq('id', complaintId)
      .single();

    if (fetchErr || !complaint) {
      console.error('Could not find complaint:', fetchErr);
      return;
    }

    // Run the reward algorithm
    const { credits, breakdown } = calculateReward({
      severity:   complaint.severity || 'medium',
      category:   complaint.category || 'Other',
      filedAt:    complaint.created_at,
      resolvedAt: complaint.updated_at || new Date().toISOString(),
    });

    console.log('Reward breakdown:', breakdown);
    console.log('Awarding', credits, 'credits to user:', complaint.user_id);

    // Approach 1: Try RPC function
    const { error: rpcErr } = await supabase.rpc('award_credits', {
      target_user_id: complaint.user_id,
      credit_amount: credits,
    });

    if (rpcErr) {
      console.warn('RPC failed, trying direct update. RPC error:', rpcErr.message, rpcErr);

      // Approach 2: Fallback — direct profile update
      const { data: profile, error: readErr } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', complaint.user_id)
        .single();

      if (readErr) {
        console.error('Could not read profile:', readErr);
        showToast('Credit award failed — check console for details', 'error');
        return;
      }

      const currentCredits = profile?.credits || 0;
      const newCredits = currentCredits + credits;

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', complaint.user_id);

      if (updateErr) {
        console.error('Direct update also failed:', updateErr);
        showToast('Credit award failed — check console for details', 'error');
      } else {
        console.log('Credits awarded via direct update:', newCredits);
        showToast(`${credits} credits awarded! (${breakdown.severity.toUpperCase()} × ${breakdown.category} × ${breakdown.speedLabel})`, 'success');
      }
    } else {
      console.log('Credits awarded via RPC');
      showToast(`${credits} credits awarded! (${breakdown.severity.toUpperCase()} × ${breakdown.category} × ${breakdown.speedLabel})`, 'success');
    }
  } catch (err) {
    console.error('Credit award error:', err);
  }
}

// ─── Load User Credits (sidebar) ───
async function loadUserCredits() {
  const creditsEl = document.getElementById('stat-credits');
  if (!creditsEl || !currentUser) return;

  const { data } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', currentUser.id)
    .single();

  creditsEl.textContent = data?.credits || 0;
}

// ─── Locate User ───
function locateUser() {
  if (!navigator.geolocation) {
    showToast('Geolocation not supported', 'warning');
    return;
  }

  const btn = document.getElementById('locate-btn');
  if (btn) btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Locating...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude: lat, longitude: lng } = position.coords;
      map.flyTo([lat, lng], 16);

      L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: '#1C4D8D',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(map).bindPopup('You are here').openPopup();

      if (btn) btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> My Location';
      showToast('Location found!', 'success');
    },
    (err) => {
      console.error('Geolocation error:', err.code, err.message);
      let msg = 'Unable to get your location';
      if (err.code === 1) msg = 'Location access denied. Please allow location in browser settings.';
      if (err.code === 2) msg = 'Location unavailable. Try again.';
      if (err.code === 3) msg = 'Location request timed out. Try again.';
      showToast(msg, 'error');
      if (btn) btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> My Location';
    },
    {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 30000,
    }
  );
}

// ─── Heatmap Toggle ───
function toggleHeatmap() {
  const btn = document.getElementById('heatmap-btn');

  if (heatmapActive) {
    if (heatmapLayer) map.removeLayer(heatmapLayer);
    heatmapActive = false;
    btn?.classList.remove('active');
  } else {
    const points = window._heatPoints || [];
    if (points.length > 0) {
      heatmapLayer = L.heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 17,
        minOpacity: 0.45,
        gradient: {
          0.2: '#3b82f6',
          0.4: '#7c3aed',
          0.6: '#f59e0b',
          0.8: '#ef4444',
          1.0: '#dc2626',
        },
      }).addTo(map);
      heatmapActive = true;
      btn?.classList.add('active');
    } else {
      showToast('No data for heatmap', 'info');
    }
  }
}

// ─── Helpers ───
function getStatusClass(status) {
  const statusMap = {
    Pending: 'pending',
    'In Progress': 'progress',
    'Awaiting Confirmation': 'awaiting',
    Resolved: 'resolved',
    Rejected: 'rejected',
  };
  return statusMap[status] || 'pending';
}

function getCategoryEmoji(category) {
  return '';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── ANIMATED SEARCH BAR — Location geocoding via Nominatim ───
function initSearchBar() {
  const searchBar = document.getElementById('search-bar');
  const searchToggle = document.getElementById('search-toggle');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchSpinner = document.getElementById('search-spinner');
  const searchWrapper = document.getElementById('search-wrapper');

  if (!searchBar || !searchInput) return;

  let isExpanded = false;
  let debounceTimer = null;
  let searchMarker = null;

  // Toggle expand/collapse
  searchToggle.addEventListener('click', () => {
    if (!isExpanded) {
      searchBar.classList.add('expanded');
      isExpanded = true;
      setTimeout(() => searchInput.focus(), 200);
    } else if (!searchInput.value.trim()) {
      collapseSearch();
    }
  });

  function collapseSearch() {
    searchBar.classList.remove('expanded');
    searchInput.value = '';
    searchResults.classList.remove('visible');
    searchResults.innerHTML = '';
    searchSpinner?.classList.add('hidden');
    isExpanded = false;
  }

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (isExpanded && !searchWrapper.contains(e.target)) {
      collapseSearch();
    }
  });

  // Close on Escape key
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') collapseSearch();
  });

  // Debounced input → geocode
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();

    if (!query) {
      searchResults.classList.remove('visible');
      searchResults.innerHTML = '';
      searchSpinner?.classList.add('hidden');
      return;
    }

    searchSpinner?.classList.remove('hidden');

    debounceTimer = setTimeout(() => {
      geocodeSearch(query);
    }, 500);
  });

  // Geocode using OpenStreetMap Nominatim (free, no API key)
  async function geocodeSearch(query) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
      });
      const data = await res.json();

      searchSpinner?.classList.add('hidden');
      renderResults(data);
    } catch (err) {
      console.error('Geocoding error:', err);
      searchSpinner?.classList.add('hidden');
      searchResults.innerHTML = '<div class="search-no-results">Search failed. Try again.</div>';
      searchResults.classList.add('visible');
    }
  }

  // Render search results
  function renderResults(results) {
    searchResults.innerHTML = '';

    if (!results || results.length === 0) {
      searchResults.innerHTML = '<div class="search-no-results">No locations found</div>';
      searchResults.classList.add('visible');
      return;
    }

    results.forEach((place, index) => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.style.animationDelay = `${index * 0.06}s`;

      // Extract a short name and detail
      const name = place.address?.city || place.address?.town || place.address?.village || place.address?.state || place.display_name.split(',')[0];
      const detail = place.display_name;

      item.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <div style="overflow:hidden;">
          <div class="result-name">${name}</div>
          <div class="result-detail">${detail}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        flyToResult(parseFloat(place.lat), parseFloat(place.lon), name);
        collapseSearch();
      });

      searchResults.appendChild(item);
    });

    searchResults.classList.add('visible');
  }

  // Fly to selected location
  function flyToResult(lat, lng, name) {
    if (searchMarker) map.removeLayer(searchMarker);

    map.flyTo([lat, lng], 15, { duration: 1.5 });

    searchMarker = L.circleMarker([lat, lng], {
      radius: 10,
      fillColor: '#4988C4',
      color: '#0F2854',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.7,
    }).addTo(map).bindPopup(`<b>${name}</b>`).openPopup();

    showToast(`Moved to ${name}`, 'success');
  }
}
