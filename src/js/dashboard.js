// ═══════════════════════════════════════════════════════════
// CIVIC LENS — Dashboard Logic
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

  updateStats(complaints || []);
  renderComplaints(complaints || []);
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
    card.className = 'complaint-card';
    card.style.animationDelay = `${index * 0.05}s`;
    card.innerHTML = `
      <div class="cc-header">
        <span class="badge badge-${getStatusClass(issue.status)}">${issue.status}</span>
        <small>${formatDate(issue.created_at)}</small>
      </div>
      <div class="cc-category">${getCategoryEmoji(issue.category)} ${issue.category}</div>
      <div class="cc-desc">${issue.description}</div>
      ${issue.image_url ? `<img class="cc-image-thumb" src="${issue.image_url}" alt="Evidence" />` : ''}
      ${renderActions(issue)}
    `;

    // Click card to fly to marker
    card.addEventListener('click', () => {
      map.flyTo([issue.lat, issue.lng], 16);
      marker.openPopup();
    });

    listContainer.appendChild(card);
  });

  // Store heat points for toggle
  window._heatPoints = heatPoints;
}

function renderActions(issue) {
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

  // Delegated events: status updates
  document.getElementById('complaints-list')?.addEventListener('change', async (e) => {
    if (e.target.classList.contains('status-select')) {
      const id = e.target.dataset.id;
      const newStatus = e.target.value;
      await updateComplaintStatus(id, newStatus);
    }
  });

  document.getElementById('complaints-list')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.confirm-btn');
    if (btn) {
      await updateComplaintStatus(btn.dataset.id, 'Resolved');
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

    // Award credits when complaint is resolved
    if (newStatus === 'Resolved') {
      await awardCreditsWithAlgorithm(id);
    }

    await loadComplaints();
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
  const map = {
    Pending: 'pending',
    'In Progress': 'progress',
    'Awaiting Confirmation': 'awaiting',
    Resolved: 'resolved',
  };
  return map[status] || 'pending';
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
