// Along Local Admin Dashboard Logic
const SUPABASE_URL = 'https://bahmgqxuxuohaaubrvui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaG1ncXh1eHVvaGFhdWJydnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMzgzOTgsImV4cCI6MjEwMTYxNDM5OH0.uIlxlVJRxIlPFs8ucJO3ZeoFwX5IeBXcIbAahrQt8mA';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PASSKEY = 'along2026';

// Global State
let allHotspots = [];
let allApplications = [];
let allPlans = [];
let allReports = [];

// Helper for coordinates preset pill click
window.setCoordinates = (lat, lng) => {
  document.getElementById('hotspotLat').value = lat;
  document.getElementById('hotspotLng').value = lng;
};

document.addEventListener('DOMContentLoaded', () => {
  initGate();
  initTabs();
  initFormControls();
  
  if (isAuthorized()) {
    loadAllData();
  }
});

// Authentication Gate
function isAuthorized() {
  return sessionStorage.getItem('along_admin_auth') === 'true';
}

function initGate() {
  const gateOverlay = document.getElementById('adminGate');
  const gateForm = document.getElementById('gateForm');
  const gateInput = document.getElementById('gatePasskey');
  const gateError = document.getElementById('gateError');
  const lockBtn = document.getElementById('lockBtn');

  if (isAuthorized()) {
    gateOverlay.style.display = 'none';
  } else {
    gateOverlay.style.display = 'flex';
  }

  gateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (gateInput.value.trim() === PASSKEY) {
      sessionStorage.setItem('along_admin_auth', 'true');
      gateOverlay.style.display = 'none';
      gateError.style.display = 'none';
      loadAllData();
    } else {
      gateError.style.display = 'block';
      gateInput.value = '';
    }
  });

  lockBtn.addEventListener('click', () => {
    sessionStorage.removeItem('along_admin_auth');
    gateOverlay.style.display = 'flex';
  });
}

// Tab Switching
function initTabs() {
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      const targetEl = document.getElementById(targetTab);
      if (targetEl) targetEl.style.display = 'block';
    });
  });
}

// Form Controls
function initFormControls() {
  const toggleBtn = document.getElementById('toggleNewHotspotFormBtn');
  const formPanel = document.getElementById('hotspotFormPanel');
  const cancelBtn = document.getElementById('cancelHotspotBtn');
  const spotTypeSelect = document.getElementById('spotTypeSelect');
  const perkGroup = document.getElementById('perkTextGroup');
  const form = document.getElementById('hotspotForm');
  const runArchivalBtn = document.getElementById('runArchivalBtn');

  toggleBtn.addEventListener('click', () => {
    resetHotspotForm();
    formPanel.style.display = formPanel.style.display === 'none' ? 'block' : 'none';
    if (formPanel.style.display === 'block') {
      formPanel.scrollIntoView({ behavior: 'smooth' });
    }
  });

  cancelBtn.addEventListener('click', () => {
    resetHotspotForm();
    formPanel.style.display = 'none';
  });

  spotTypeSelect.addEventListener('change', () => {
    if (spotTypeSelect.value === 'public') {
      perkGroup.style.opacity = '0.4';
      document.getElementById('hotspotPerk').value = '';
      document.getElementById('hotspotPerk').placeholder = 'Public spot (Parks, Trails) - No perk discount needed';
    } else {
      perkGroup.style.opacity = '1';
      document.getElementById('hotspotPerk').placeholder = 'e.g. 10% off bill for Along groups of 4+';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveHotspot();
  });

  runArchivalBtn.addEventListener('click', async () => {
    await runArchivalBatch();
  });
}

// Load All Dashboard Data
async function loadAllData() {
  await Promise.all([
    fetchHotspots(),
    fetchApplications(),
    fetchPlansForArchival(),
    fetchReports()
  ]);
  updateDashboardStats();
}

function updateDashboardStats() {
  const activeCount = allHotspots.filter(h => h.is_active).length;
  document.getElementById('statActiveHotspots').innerText = activeCount;
  document.getElementById('statTotalHotspots').innerText = allHotspots.length;
  document.getElementById('hotspotsCountBadge').innerText = allHotspots.length;

  const pendingApps = allApplications.filter(a => a.status === 'pending').length;
  document.getElementById('statPendingApps').innerText = pendingApps;
  document.getElementById('applicationsCountBadge').innerText = allApplications.length;

  const expiredPlans = getExpiredPlans();
  document.getElementById('statExpiredPlans').innerText = expiredPlans.length;

  const pendingReports = allReports.filter(r => (r.status || 'pending') === 'pending').length;
  const statOpenReportsEl = document.getElementById('statOpenReports');
  if (statOpenReportsEl) statOpenReportsEl.innerText = pendingReports;
  const reportsCountBadgeEl = document.getElementById('reportsCountBadge');
  if (reportsCountBadgeEl) reportsCountBadgeEl.innerText = allReports.length;
}

// ==========================================
// 1. HOTSPOTS MANAGEMENT
// ==========================================

async function fetchHotspots() {
  const tbody = document.getElementById('hotspotsTableBody');
  try {
    const { data, error } = await supabaseClient
      .from('sponsored_hotspots')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allHotspots = data || [];
    renderHotspotsTable(allHotspots);
  } catch (err) {
    console.error('Error fetching hotspots:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="color: #FF4757; text-align: center; padding: 24px;">Failed to load hotspots: ${err.message}</td></tr>`;
  }
}

function renderHotspotsTable(hotspots) {
  const tbody = document.getElementById('hotspotsTableBody');
  if (hotspots.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-dim);">No hotspots created yet. Click "+ Add New Hotspot" to add one.</td></tr>`;
    return;
  }

  tbody.innerHTML = hotspots.map(h => {
    const isPerk = !!h.perk_text;
    const badgeHtml = isPerk
      ? `<span class="badge-status" style="background: rgba(255, 71, 87, 0.15); color: #FF4757; border: 1px solid rgba(255, 71, 87, 0.3);">🎁 ${escapeHtml(h.perk_text)}</span>`
      : `<span class="badge-status" style="background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3);">POPULAR SPOT 🌿</span>`;

    const statusBadge = h.is_active
      ? `<span class="badge-status active">Active</span>`
      : `<span class="badge-status inactive">Inactive</span>`;

    const tagsStr = Array.isArray(h.tags) ? h.tags.join(', ') : (h.tags || '');

    return `
      <tr>
        <td>
          <img src="${escapeHtml(h.image_url)}" alt="${escapeHtml(h.name)}" style="width: 52px; height: 52px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border-subtle);">
        </td>
        <td>
          <div style="font-weight: 800; color: #fff; font-size: 14px;">${escapeHtml(h.name)}</div>
          <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">🏷️ ${escapeHtml(tagsStr)}</div>
        </td>
        <td>${badgeHtml}</td>
        <td style="max-width: 240px; font-size: 12px; line-height: 1.4; color: var(--text-muted);">
          ${escapeHtml(h.description || 'No description provided')}
        </td>
        <td style="white-space: nowrap; font-size: 12px;">
          <div>🗺️ Google: <strong>${h.google_rating ? '★ ' + h.google_rating : 'N/A'}</strong></div>
          <div style="color: #FF4757;">✨ Along: <strong>${h.along_rating ? '★ ' + h.along_rating : 'N/A'}</strong></div>
        </td>
        <td style="font-size: 11px; font-family: monospace; color: var(--text-dim);">
          ${h.latitude?.toFixed(4)}, ${h.longitude?.toFixed(4)}
        </td>
        <td>${statusBadge}</td>
        <td style="white-space: nowrap;">
          <button class="action-btn" onclick="editHotspot('${h.id}')">✏️ Edit</button>
          <button class="action-btn" onclick="toggleHotspotActive('${h.id}', ${!h.is_active})">
            ${h.is_active ? 'Hide' : 'Activate'}
          </button>
          <button class="action-btn btn-danger" onclick="deleteHotspot('${h.id}', '${escapeHtml(h.name)}')">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function resetHotspotForm() {
  document.getElementById('hotspotId').value = '';
  document.getElementById('hotspotName').value = '';
  document.getElementById('hotspotTags').value = '';
  document.getElementById('spotTypeSelect').value = 'commercial';
  document.getElementById('hotspotPerk').value = '';
  document.getElementById('hotspotDescription').value = '';
  document.getElementById('hotspotGoogleRating').value = '';
  document.getElementById('hotspotAlongRating').value = '';
  document.getElementById('hotspotLat').value = '';
  document.getElementById('hotspotLng').value = '';
  document.getElementById('hotspotImage').value = '';
  document.getElementById('hotspotActive').checked = true;
  document.getElementById('formTitle').innerText = '✨ Add New Hotspot Location';
  document.getElementById('saveHotspotBtn').innerText = 'Save Hotspot Location';
  document.getElementById('perkTextGroup').style.opacity = '1';
}

window.editHotspot = (id) => {
  const spot = allHotspots.find(h => h.id === id);
  if (!spot) return;

  document.getElementById('hotspotId').value = spot.id;
  document.getElementById('hotspotName').value = spot.name || '';
  document.getElementById('hotspotTags').value = Array.isArray(spot.tags) ? spot.tags.join(', ') : (spot.tags || '');
  
  if (spot.perk_text) {
    document.getElementById('spotTypeSelect').value = 'commercial';
    document.getElementById('hotspotPerk').value = spot.perk_text;
    document.getElementById('perkTextGroup').style.opacity = '1';
  } else {
    document.getElementById('spotTypeSelect').value = 'public';
    document.getElementById('hotspotPerk').value = '';
    document.getElementById('perkTextGroup').style.opacity = '0.4';
  }

  document.getElementById('hotspotDescription').value = spot.description || '';
  document.getElementById('hotspotGoogleRating').value = spot.google_rating || '';
  document.getElementById('hotspotAlongRating').value = spot.along_rating || '';
  document.getElementById('hotspotLat').value = spot.latitude || '';
  document.getElementById('hotspotLng').value = spot.longitude || '';
  document.getElementById('hotspotImage').value = spot.image_url || '';
  document.getElementById('hotspotActive').checked = spot.is_active !== false;

  document.getElementById('formTitle').innerText = `✏️ Edit: ${spot.name}`;
  document.getElementById('saveHotspotBtn').innerText = 'Update Hotspot';

  const formPanel = document.getElementById('hotspotFormPanel');
  formPanel.style.display = 'block';
  formPanel.scrollIntoView({ behavior: 'smooth' });
};

async function saveHotspot() {
  const id = document.getElementById('hotspotId').value;
  const name = document.getElementById('hotspotName').value.trim();
  const tagsRaw = document.getElementById('hotspotTags').value.trim();
  const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
  const spotType = document.getElementById('spotTypeSelect').value;
  const perk_text = spotType === 'commercial' ? (document.getElementById('hotspotPerk').value.trim() || null) : null;
  const description = document.getElementById('hotspotDescription').value.trim();
  const google_rating = parseFloat(document.getElementById('hotspotGoogleRating').value) || null;
  const along_rating = parseFloat(document.getElementById('hotspotAlongRating').value) || null;
  const latitude = parseFloat(document.getElementById('hotspotLat').value);
  const longitude = parseFloat(document.getElementById('hotspotLng').value);
  const image_url = document.getElementById('hotspotImage').value.trim();
  const is_active = document.getElementById('hotspotActive').checked;

  const payload = {
    name,
    tags,
    perk_text,
    description,
    google_rating,
    along_rating,
    latitude,
    longitude,
    image_url,
    is_active
  };

  const saveBtn = document.getElementById('saveHotspotBtn');
  saveBtn.disabled = true;
  saveBtn.innerText = 'Saving to Database...';

  try {
    if (id) {
      // Update
      const { error } = await supabaseClient
        .from('sponsored_hotspots')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
    } else {
      // Insert
      const { error } = await supabaseClient
        .from('sponsored_hotspots')
        .insert([payload]);
      if (error) throw error;
    }

    document.getElementById('hotspotFormPanel').style.display = 'none';
    resetHotspotForm();
    await fetchHotspots();
    updateDashboardStats();
    alert(`🎉 Successfully saved hotspot "${name}"! It is now live in the mobile app.`);
  } catch (err) {
    alert(`Failed to save hotspot: ${err.message}`);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = id ? 'Update Hotspot' : 'Save Hotspot Location';
  }
}

window.toggleHotspotActive = async (id, nextState) => {
  try {
    const { error } = await supabaseClient
      .from('sponsored_hotspots')
      .update({ is_active: nextState })
      .eq('id', id);
    if (error) throw error;
    await fetchHotspots();
    updateDashboardStats();
  } catch (err) {
    alert(`Failed to toggle hotspot status: ${err.message}`);
  }
};

window.deleteHotspot = async (id, name) => {
  if (!confirm(`Are you sure you want to permanently delete "${name}" from hotspots?`)) return;
  try {
    const { error } = await supabaseClient
      .from('sponsored_hotspots')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await fetchHotspots();
    updateDashboardStats();
  } catch (err) {
    alert(`Failed to delete hotspot: ${err.message}`);
  }
};

// ==========================================
// 2. INBOUND APPLICATIONS MANAGEMENT
// ==========================================

async function fetchApplications() {
  const tbody = document.getElementById('applicationsTableBody');
  try {
    const { data, error } = await supabaseClient
      .rpc('get_admin_partner_applications', { admin_secret: PASSKEY });

    if (error) throw error;
    allApplications = data || [];
    renderApplicationsTable(allApplications);
  } catch (err) {
    console.error('Error fetching applications:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="color: #FF4757; text-align: center; padding: 24px;">Failed to load applications: ${err.message}</td></tr>`;
  }
}

function renderApplicationsTable(apps) {
  const tbody = document.getElementById('applicationsTableBody');
  if (apps.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-dim);">No applications received yet. Submit one on the public landing page to test.</td></tr>`;
    return;
  }

  tbody.innerHTML = apps.map(app => {
    const dateFormatted = new Date(app.created_at).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });

    const statusBadge = `<span class="badge-status ${app.status}">${escapeHtml(app.status.toUpperCase())}</span>`;

    return `
      <tr>
        <td style="white-space: nowrap; font-size: 11px; color: var(--text-dim);">${dateFormatted}</td>
        <td>
          <div style="font-weight: 800; color: #fff; font-size: 14px;">${escapeHtml(app.venue_name)}</div>
        </td>
        <td>
          <span style="font-size: 11px; background: rgba(255, 255, 255, 0.05); padding: 3px 8px; border-radius: 4px;">
            ${escapeHtml(app.category)}
          </span>
        </td>
        <td style="color: var(--text-muted); font-size: 12px;">📍 ${escapeHtml(app.city_area)}</td>
        <td style="font-size: 12px;">
          <div style="font-weight: 700;">${escapeHtml(app.contact_name)}</div>
          <div style="color: var(--amber); font-size: 11px;">📞 ${escapeHtml(app.contact_phone)}</div>
          ${app.contact_email ? `<div style="color: var(--text-dim); font-size: 11px;">✉️ ${escapeHtml(app.contact_email)}</div>` : ''}
        </td>
        <td style="max-width: 200px; font-size: 12px; color: #FFD32A;">
          ${escapeHtml(app.proposed_perk || 'None specified')}
        </td>
        <td>${statusBadge}</td>
        <td style="white-space: nowrap;">
          <button class="action-btn btn-success" onclick="convertAppToHotspot('${app.id}')">⚡ Approve & Add Spot</button>
          <button class="action-btn" onclick="updateAppStatus('${app.id}', 'contacted')">Mark Contacted</button>
          <button class="action-btn btn-danger" onclick="updateAppStatus('${app.id}', 'rejected')">Reject</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.updateAppStatus = async (id, status) => {
  try {
    const { error } = await supabaseClient
      .rpc('update_admin_partner_application_status', {
        admin_secret: PASSKEY,
        target_id: id,
        new_status: status
      });
    if (error) throw error;
    await fetchApplications();
    updateDashboardStats();
  } catch (err) {
    alert(`Failed to update application status: ${err.message}`);
  }
};

window.convertAppToHotspot = (appId) => {
  const app = allApplications.find(a => a.id === appId);
  if (!app) return;

  // Switch to Hotspots tab
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-tab="hotspotsTab"]').classList.add('active');
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  document.getElementById('hotspotsTab').style.display = 'block';

  // Fill form with venue application details
  resetHotspotForm();
  document.getElementById('hotspotName').value = app.venue_name;
  document.getElementById('hotspotTags').value = app.category;
  document.getElementById('spotTypeSelect').value = 'commercial';
  document.getElementById('hotspotPerk').value = app.proposed_perk || '10% off bill for Along members';
  document.getElementById('hotspotDescription').value = `${app.venue_name} located in ${app.city_area}. Partnered with Along for exclusive community gatherings.`;
  document.getElementById('hotspotGoogleRating').value = 4.5;
  document.getElementById('hotspotAlongRating').value = 4.8;
  document.getElementById('hotspotImage').value = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80';

  // Default coords to Banjara Hills
  setCoordinates(17.4325, 78.4071);

  document.getElementById('formTitle').innerText = `✨ Convert Partner Application: ${app.venue_name}`;
  document.getElementById('hotspotFormPanel').style.display = 'block';
  document.getElementById('hotspotFormPanel').scrollIntoView({ behavior: 'smooth' });

  // Mark app as approved
  updateAppStatus(appId, 'approved');
};

// ==========================================
// 3. 10-DAY HANGOUT ARCHIVAL & MAINTENANCE
// ==========================================

async function fetchPlansForArchival() {
  const tbody = document.getElementById('expiredPlansTableBody');
  try {
    const { data, error } = await supabaseClient
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allPlans = data || [];
    renderExpiredPlansTable(getExpiredPlans());
  } catch (err) {
    console.error('Error fetching plans for archival:', err);
    tbody.innerHTML = `<tr><td colspan="5" style="color: #FF4757; text-align: center; padding: 24px;">Failed to load hangouts: ${err.message}</td></tr>`;
  }
}

function getExpiredPlans() {
  const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
  const threshold = Date.now() - TEN_DAYS_MS;

  return allPlans.filter(p => {
    // Check scheduled_date or created_at
    const planDate = p.scheduled_date ? new Date(p.scheduled_date).getTime() : new Date(p.created_at).getTime();
    return planDate < threshold;
  });
}

function renderExpiredPlansTable(expired) {
  const tbody = document.getElementById('expiredPlansTableBody');
  if (expired.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--emerald);">✅ All clean! No hangouts currently exceed the 10-day active threshold.</td></tr>`;
    return;
  }

  tbody.innerHTML = expired.map(p => {
    const dateStr = p.scheduled_date ? new Date(p.scheduled_date).toLocaleDateString('en-IN') : new Date(p.created_at).toLocaleDateString('en-IN');
    const isAlreadyCompleted = p.status === 'completed';

    return `
      <tr>
        <td style="font-weight: 700; color: #fff;">${escapeHtml(p.title)}</td>
        <td style="color: var(--text-muted); font-size: 12px;">📍 ${escapeHtml(p.venue)}</td>
        <td style="color: var(--text-dim); font-size: 12px;">${dateStr}</td>
        <td>
          <span class="badge-status ${isAlreadyCompleted ? 'approved' : 'inactive'}">
            ${escapeHtml((p.status || 'active').toUpperCase())}
          </span>
        </td>
        <td>
          ${!isAlreadyCompleted ? `
            <button class="action-btn btn-danger" onclick="archiveSinglePlan('${p.id}')">Archive Now</button>
          ` : `<span style="font-size: 11px; color: var(--emerald);">Archived</span>`}
        </td>
      </tr>
    `;
  }).join('');
}

window.archiveSinglePlan = async (planId) => {
  try {
    const { error } = await supabaseClient
      .from('plans')
      .update({ status: 'completed' })
      .eq('id', planId);
    if (error) throw error;
    await fetchPlansForArchival();
    updateDashboardStats();
    alert('Hangout marked as completed and chat sealed.');
  } catch (err) {
    alert(`Failed to archive plan: ${err.message}`);
  }
};

async function runArchivalBatch() {
  const expired = getExpiredPlans().filter(p => p.status !== 'completed');
  const feedback = document.getElementById('archivalFeedback');
  const btn = document.getElementById('runArchivalBtn');

  if (expired.length === 0) {
    feedback.style.display = 'block';
    feedback.style.background = 'rgba(16, 185, 129, 0.15)';
    feedback.style.color = '#10B981';
    feedback.style.border = '1px solid rgba(16, 185, 129, 0.3)';
    feedback.innerHTML = `<strong>✅ System Up to Date!</strong> No hangouts older than 10 days need archival.`;
    return;
  }

  btn.disabled = true;
  btn.innerText = `Archiving ${expired.length} hangouts...`;

  try {
    const ids = expired.map(p => p.id);
    const { error } = await supabaseClient
      .from('plans')
      .update({ status: 'completed' })
      .in('id', ids);

    if (error) throw error;

    feedback.style.display = 'block';
    feedback.style.background = 'rgba(16, 185, 129, 0.15)';
    feedback.style.color = '#10B981';
    feedback.style.border = '1px solid rgba(16, 185, 129, 0.3)';
    feedback.innerHTML = `<strong>🎉 Archival Batch Complete!</strong> Successfully archived ${expired.length} hangouts older than 10 days and sealed their chat rooms.`;

    await fetchPlansForArchival();
    updateDashboardStats();
  } catch (err) {
    feedback.style.display = 'block';
    feedback.style.background = 'rgba(255, 71, 87, 0.15)';
    feedback.style.color = '#FF4757';
    feedback.style.border = '1px solid rgba(255, 71, 87, 0.3)';
    feedback.innerHTML = `<strong>Archival Error:</strong> ${err.message}`;
  } finally {
    btn.disabled = false;
    btn.innerText = '⚡ Run Archival Job Now';
  }
}

// Utility: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==========================================
// 4. REPORTS & SAFETY MODERATION
// ==========================================

async function fetchReports() {
  const tbody = document.getElementById('reportsTableBody');
  if (!tbody) return;

  try {
    const { data, error } = await supabaseClient
      .rpc('get_admin_reports', { admin_secret: PASSKEY });

    if (error) {
      // Fallback direct query if RPC is deploying
      const { data: directData, error: directErr } = await supabaseClient
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (directErr) throw directErr;
      allReports = directData || [];
    } else {
      allReports = data || [];
    }

    renderReportsTable(allReports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--emerald);">✅ No open safety reports. Community is clean!</td></tr>`;
  }
}

function renderReportsTable(reports) {
  const tbody = document.getElementById('reportsTableBody');
  if (!tbody) return;

  if (reports.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--emerald);">✅ Community is safe! Zero active incident reports.</td></tr>`;
    return;
  }

  tbody.innerHTML = reports.map(r => {
    const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--';
    const isPending = (r.status || 'pending') === 'pending';

    return `
      <tr>
        <td style="color: var(--text-dim); font-size: 12px; white-space: nowrap;">${dateStr}</td>
        <td>
          <div style="font-weight: 700; color: #fff;">${escapeHtml(r.reported_user_name || 'Reported User')}</div>
          <div style="font-size: 11px; color: var(--text-dim); font-family: monospace;">ID: ${escapeHtml((r.reported_user_id || '').slice(0, 8))}...</div>
        </td>
        <td>
          <div style="color: var(--text-muted); font-size: 13px;">${escapeHtml(r.reporter_name || 'Anonymous Member')}</div>
        </td>
        <td>
          <div style="color: var(--amber); font-size: 13px; font-weight: 600;">${escapeHtml(r.plan_title || 'Direct Report')}</div>
        </td>
        <td>
          <span class="badge-status inactive" style="font-size: 11px;">${escapeHtml(r.reason || 'General Report')}</span>
        </td>
        <td style="max-width: 220px; font-size: 12px; color: var(--text-muted); line-height: 16px;">
          ${escapeHtml(r.details || 'No additional details provided.')}
        </td>
        <td>
          <span class="badge-status ${isPending ? 'pending' : (r.status === 'dismissed' ? 'inactive' : 'approved')}">
            ${escapeHtml((r.status || 'pending').toUpperCase())}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 6px; flex-wrap: nowrap;">
            ${isPending ? `
              <button class="action-btn btn-success" style="font-size: 11px; padding: 4px 8px;" onclick="resolveReportAction('${r.id}', 'resolved', 'warn')">Resolve</button>
              <button class="action-btn btn-danger" style="font-size: 11px; padding: 4px 8px;" onclick="resolveReportAction('${r.id}', 'resolved', 'ban')">Ban User</button>
              <button class="action-btn" style="font-size: 11px; padding: 4px 8px;" onclick="resolveReportAction('${r.id}', 'dismissed', 'dismiss')">Dismiss</button>
            ` : `
              <span style="font-size: 11px; color: var(--text-dim);">Actioned</span>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.resolveReportAction = async (reportId, newStatus, actionType) => {
  const confirmMsg = actionType === 'ban' 
    ? 'Are you sure you want to ban/unverify this reported user?'
    : `Mark this report as ${newStatus}?`;

  if (!confirm(confirmMsg)) return;

  try {
    const { error } = await supabaseClient.rpc('update_admin_report_status', {
      admin_secret: PASSKEY,
      target_report_id: reportId,
      new_status: newStatus,
      moderation_action: actionType
    });

    if (error) {
      // Fallback direct update
      await supabaseClient
        .from('reports')
        .update({ status: newStatus, action_taken: actionType })
        .eq('id', reportId);
    }

    alert('Report status updated successfully.');
    await fetchReports();
    updateDashboardStats();
  } catch (err) {
    alert(`Failed to update report: ${err.message}`);
  }
};
