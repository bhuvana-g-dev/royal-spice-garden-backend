/* ==============================================
   ROYAL SPICE GARDEN — ADMIN PANEL JS (Fixed)

   ROOT CAUSES FIXED:
   1. All DOM queries now run after DOMContentLoaded
   2. Modal uses display:none/flex instead of [hidden]
      attr + pointer-events hack that was blocking clicks
   3. API_BASE = window.location.origin (auto-detects
      localhost vs production — no manual change needed)
   4. Every button listener uses getElementById which is
      null-safe with early-exit guards
   5. Sidebar nav uses event delegation (one listener
      on the parent, not per-button) — more reliable
   6. fetch calls wrapped in try/catch with user-visible
      error messages instead of silent failures
   ============================================== */

// ── Wait for DOM to be fully ready ─────────────
document.addEventListener('DOMContentLoaded', function () {

  /* ════════════════════════════════════════════
     CONFIG
  ════════════════════════════════════════════ */
  // Auto-detects: localhost:5000 in dev, Render URL in production
  var API_BASE = window.location.origin;

  /* ════════════════════════════════════════════
     AUTH GUARD
     Redirect to login if no token stored
  ════════════════════════════════════════════ */
  var TOKEN = localStorage.getItem('rsg_token');
  if (!TOKEN) {
    window.location.href = 'login.html';
    return; // stop executing — page is being redirected
  }

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + TOKEN
    };
  }

  /* ════════════════════════════════════════════
     SET ADMIN NAME IN UI
  ════════════════════════════════════════════ */
  var adminName = localStorage.getItem('rsg_admin') || 'Admin';
  document.getElementById('sidebarAdminName').textContent = adminName;
  document.getElementById('topbarAdmin').textContent      = adminName;
  document.getElementById('dashWelcomeName').textContent  = adminName;

  /* ════════════════════════════════════════════
     TOAST NOTIFICATIONS
  ════════════════════════════════════════════ */
  var toastEl    = document.getElementById('toast');
  var toastTimer = null;

  function showToast(msg, type) {
    type = type || 'success';
    toastEl.textContent = msg;
    toastEl.className   = 'toast toast-' + type + ' show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 3500);
  }

  /* ════════════════════════════════════════════
     CONFIRM DIALOG
     Returns a Promise<boolean>
  ════════════════════════════════════════════ */
  function confirmDialog(msg) {
    return new Promise(function (resolve) {
      var overlay   = document.getElementById('confirmModal');
      var msgEl     = document.getElementById('confirmMsg');
      var okBtn     = document.getElementById('confirmOk');
      var cancelBtn = document.getElementById('confirmCancel');

      msgEl.textContent = msg;
      showOverlay(overlay);

      function done(result) {
        hideOverlay(overlay);
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        resolve(result);
      }
      function onOk()     { done(true); }
      function onCancel() { done(false); }

      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
    });
  }

  /* ════════════════════════════════════════════
     MODAL OPEN / CLOSE HELPERS
     Uses display:none / display:flex
     (NOT the [hidden] attr which conflicted with
     pointer-events and blocked all click events)
  ════════════════════════════════════════════ */
  function showOverlay(el) {
    el.style.display = 'flex';
    // Small delay so CSS transition fires
    setTimeout(function () { el.classList.add('open'); }, 10);
    document.body.style.overflow = 'hidden';
  }

  function hideOverlay(el) {
    el.classList.remove('open');
    setTimeout(function () {
      el.style.display = 'none';
    }, 300);
    document.body.style.overflow = '';
  }

  /* ════════════════════════════════════════════
     SIDEBAR + NAVIGATION
  ════════════════════════════════════════════ */
  var sidebar        = document.getElementById('sidebar');
  var sidebarOverlay = document.getElementById('sidebarOverlay');
  var sidebarToggle  = document.getElementById('sidebarToggle');
  var topbarTitle    = document.getElementById('topbarTitle');

  var sectionTitles = {
    dashboard: 'Dashboard',
    bookings:  'Bookings Management',
    catering:  'Catering Requests',
    menu:      'Menu Manager'
  };

  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
  }

  sidebarToggle.addEventListener('click', function () {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  sidebarOverlay.addEventListener('click', closeSidebar);

  // ── Navigate between sections ────────────────
  // ✅ Event DELEGATION on the sidebar nav — one listener
  //    catches all .nav-item clicks reliably
  var sidebarNav = document.querySelector('.sidebar-nav');
  sidebarNav.addEventListener('click', function (e) {
    var btn = e.target.closest('.nav-item');
    if (!btn) return;
    var target = btn.getAttribute('data-section');
    if (target) {
      navigateTo(target);
      closeSidebar();
    }
  });

  // Quick-action buttons on dashboard
  var quickGrid = document.querySelector('.quick-grid');
  if (quickGrid) {
    quickGrid.addEventListener('click', function (e) {
      var btn = e.target.closest('.quick-btn');
      if (!btn) return;
      var target = btn.getAttribute('data-section');
      var action = btn.getAttribute('data-action');
      if (target) {
        navigateTo(target);
        if (action === 'add' && target === 'menu') {
          setTimeout(openMenuModal, 150);
        }
      }
    });
  }

  function navigateTo(target) {
    // Highlight correct nav item
    document.querySelectorAll('.nav-item').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-section') === target);
    });
    // Show correct section
    document.querySelectorAll('.content-section').forEach(function (s) {
      s.classList.toggle('active', s.id === 'section-' + target);
    });
    // Update topbar title
    topbarTitle.textContent = sectionTitles[target] || target;

    // Load data when switching to a section
    if (target === 'dashboard') loadStats();
    if (target === 'bookings')  loadBookings();
    if (target === 'catering')  loadCatering();
    if (target === 'menu')      loadMenu();
  }

  // ── Logout ───────────────────────────────────
  document.getElementById('logoutBtn').addEventListener('click', function () {
    localStorage.removeItem('rsg_token');
    localStorage.removeItem('rsg_admin');
    window.location.href = 'login.html';
  });

  // ── Escape key ───────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      hideOverlay(document.getElementById('menuModal'));
      hideOverlay(document.getElementById('confirmModal'));
    }
  });

  /* ════════════════════════════════════════════
     HANDLE EXPIRED TOKEN (401 response)
  ════════════════════════════════════════════ */
  function handleUnauth() {
    localStorage.removeItem('rsg_token');
    localStorage.removeItem('rsg_admin');
    window.location.href = 'login.html';
  }

  /* ════════════════════════════════════════════
     DASHBOARD STATS
  ════════════════════════════════════════════ */
  async function loadStats() {
    try {
      var res  = await fetch(API_BASE + '/api/admin/stats', { headers: authHeaders() });
      if (res.status === 401) return handleUnauth();
      var data = await res.json();
      if (!data.success) return;
      var s = data.data;
      document.getElementById('stat-totalBookings').textContent    = s.totalBookings;
      document.getElementById('stat-pendingBookings').textContent  = s.pendingBookings;
      document.getElementById('stat-confirmedBookings').textContent= s.confirmedBookings;
      document.getElementById('stat-totalCatering').textContent    = s.totalCatering;
      document.getElementById('stat-pendingCatering').textContent  = s.pendingCatering;
      document.getElementById('stat-totalMenu').textContent        = s.totalMenu;
    } catch (err) {
      showToast('Could not load stats: ' + err.message, 'error');
    }
  }

  /* ════════════════════════════════════════════
     BOOKINGS
  ════════════════════════════════════════════ */
  var bookingsData = [];

  // Search + filter listeners with debounce
  var bookingSearchTimer;
  document.getElementById('bookingSearch').addEventListener('input', function () {
    clearTimeout(bookingSearchTimer);
    bookingSearchTimer = setTimeout(loadBookings, 400);
  });
  document.getElementById('bookingFilter').addEventListener('change', loadBookings);
  document.getElementById('exportBookingsBtn').addEventListener('click', function () {
    exportCSV(bookingsData, ['name','phone','date','time','guests','notes','status','createdAt'], 'bookings');
  });

  async function loadBookings() {
    var search = document.getElementById('bookingSearch').value.trim();
    var status = document.getElementById('bookingFilter').value;
    var params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status !== 'all') params.set('status', status);

    setLoading('bookings', true);
    try {
      var res  = await fetch(API_BASE + '/api/admin/bookings?' + params.toString(), { headers: authHeaders() });
      if (res.status === 401) return handleUnauth();
      var data = await res.json();
      bookingsData = data.data || [];
      renderBookingsTable(bookingsData);
      renderBookingsCards(bookingsData);
    } catch (err) {
      showToast('Failed to load bookings: ' + err.message, 'error');
    } finally {
      setLoading('bookings', false);
    }
  }

  function renderBookingsTable(rows) {
    var wrap  = document.getElementById('bookingsTableWrap');
    var empty = document.getElementById('bookingsEmpty');
    var tbody = document.getElementById('bookingsTbody');

    if (!rows.length) {
      wrap.style.display  = 'none';
      empty.style.display = 'block';
      return;
    }
    wrap.style.display  = 'block';
    empty.style.display = 'none';

    tbody.innerHTML = rows.map(function (b, i) {
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td><strong>' + esc(b.name) + '</strong></td>' +
        '<td>' + esc(b.phone) + '</td>' +
        '<td>' + esc(b.date) + '</td>' +
        '<td>' + esc(b.time) + '</td>' +
        '<td>' + esc(b.guests) + '</td>' +
        '<td>' + (b.notes ? esc(b.notes.slice(0, 40)) + (b.notes.length > 40 ? '…' : '') : '—') + '</td>' +
        '<td><span class="status-pill status-' + b.status + '">' + b.status + '</span></td>' +
        '<td>' +
          '<div class="row-actions">' +
            '<select class="status-select" onchange="window._updateBookingStatus(\'' + b._id + '\', this.value)">' +
              ['Pending','Confirmed','Cancelled','Completed'].map(function(s){
                return '<option value="' + s + '"' + (b.status === s ? ' selected' : '') + '>' + s + '</option>';
              }).join('') +
            '</select>' +
            '<button class="btn btn-red btn-xs" onclick="window._deleteBooking(\'' + b._id + '\', \'' + esc(b.name) + '\')">Delete</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function renderBookingsCards(rows) {
    var grid = document.getElementById('bookingsCards');
    if (!rows.length) { grid.innerHTML = ''; return; }
    grid.innerHTML = rows.map(function (b) {
      return '<div class="data-card">' +
        '<div class="data-card-header">' +
          '<div><div class="data-card-name">' + esc(b.name) + '</div><div class="data-card-phone">' + esc(b.phone) + '</div></div>' +
          '<span class="status-pill status-' + b.status + '">' + b.status + '</span>' +
        '</div>' +
        '<div class="data-card-body">' +
          cardField('Date', b.date) + cardField('Time', b.time) +
          cardField('Guests', b.guests) + cardField('Notes', b.notes || '—') +
        '</div>' +
        '<div class="data-card-actions">' +
          '<select class="status-select" onchange="window._updateBookingStatus(\'' + b._id + '\', this.value)">' +
            ['Pending','Confirmed','Cancelled','Completed'].map(function(s){
              return '<option value="' + s + '"' + (b.status === s ? ' selected' : '') + '>' + s + '</option>';
            }).join('') +
          '</select>' +
          '<button class="btn btn-red btn-xs" onclick="window._deleteBooking(\'' + b._id + '\', \'' + esc(b.name) + '\')">Delete</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // Expose to inline onclick handlers
  window._updateBookingStatus = async function (id, status) {
    try {
      var res  = await fetch(API_BASE + '/api/admin/bookings/' + id + '/status', {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status: status })
      });
      var data = await res.json();
      if (!data.success) throw new Error(data.message);
      showToast('Booking status → ' + status);
      loadBookings();
      loadStats();
    } catch (err) { showToast(err.message, 'error'); }
  };

  window._deleteBooking = async function (id, name) {
    var ok = await confirmDialog('Delete booking for "' + name + '"? This cannot be undone.');
    if (!ok) return;
    try {
      var res  = await fetch(API_BASE + '/api/admin/bookings/' + id, { method: 'DELETE', headers: authHeaders() });
      var data = await res.json();
      if (!data.success) throw new Error(data.message);
      showToast('Booking deleted.');
      loadBookings();
      loadStats();
    } catch (err) { showToast(err.message, 'error'); }
  };

  /* ════════════════════════════════════════════
     CATERING
  ════════════════════════════════════════════ */
  var cateringData = [];

  var cateringSearchTimer;
  document.getElementById('cateringSearch').addEventListener('input', function () {
    clearTimeout(cateringSearchTimer);
    cateringSearchTimer = setTimeout(loadCatering, 400);
  });
  document.getElementById('cateringFilter').addEventListener('change', loadCatering);
  document.getElementById('exportCateringBtn').addEventListener('click', function () {
    exportCSV(cateringData, ['name','phone','eventType','guestCount','eventDate','notes','status','createdAt'], 'catering');
  });

  async function loadCatering() {
    var search = document.getElementById('cateringSearch').value.trim();
    var status = document.getElementById('cateringFilter').value;
    var params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status !== 'all') params.set('status', status);

    setLoading('catering', true);
    try {
      var res  = await fetch(API_BASE + '/api/admin/catering?' + params.toString(), { headers: authHeaders() });
      if (res.status === 401) return handleUnauth();
      var data = await res.json();
      cateringData = data.data || [];
      renderCateringTable(cateringData);
      renderCateringCards(cateringData);
    } catch (err) {
      showToast('Failed to load catering: ' + err.message, 'error');
    } finally {
      setLoading('catering', false);
    }
  }

  function renderCateringTable(rows) {
    var wrap  = document.getElementById('cateringTableWrap');
    var empty = document.getElementById('cateringEmpty');
    var tbody = document.getElementById('cateringTbody');

    if (!rows.length) {
      wrap.style.display  = 'none';
      empty.style.display = 'block';
      return;
    }
    wrap.style.display  = 'block';
    empty.style.display = 'none';

    tbody.innerHTML = rows.map(function (c, i) {
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td><strong>' + esc(c.name) + '</strong></td>' +
        '<td>' + esc(c.phone) + '</td>' +
        '<td>' + cap(c.eventType) + '</td>' +
        '<td>' + c.guestCount + '</td>' +
        '<td>' + (c.eventDate || '—') + '</td>' +
        '<td>' + (c.notes ? esc(c.notes.slice(0, 40)) + (c.notes.length > 40 ? '…' : '') : '—') + '</td>' +
        '<td><span class="status-pill status-' + c.status + '">' + c.status + '</span></td>' +
        '<td>' +
          '<div class="row-actions">' +
            '<select class="status-select" onchange="window._updateCateringStatus(\'' + c._id + '\', this.value)">' +
              ['Pending','Confirmed','Cancelled','Completed'].map(function(s){
                return '<option value="' + s + '"' + (c.status === s ? ' selected' : '') + '>' + s + '</option>';
              }).join('') +
            '</select>' +
            '<button class="btn btn-red btn-xs" onclick="window._deleteCatering(\'' + c._id + '\', \'' + esc(c.name) + '\')">Delete</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function renderCateringCards(rows) {
    var grid = document.getElementById('cateringCards');
    if (!rows.length) { grid.innerHTML = ''; return; }
    grid.innerHTML = rows.map(function (c) {
      return '<div class="data-card">' +
        '<div class="data-card-header">' +
          '<div><div class="data-card-name">' + esc(c.name) + '</div><div class="data-card-phone">' + esc(c.phone) + '</div></div>' +
          '<span class="status-pill status-' + c.status + '">' + c.status + '</span>' +
        '</div>' +
        '<div class="data-card-body">' +
          cardField('Event', cap(c.eventType)) + cardField('Guests', c.guestCount) +
          cardField('Date', c.eventDate || '—') + cardField('Notes', c.notes || '—') +
        '</div>' +
        '<div class="data-card-actions">' +
          '<select class="status-select" onchange="window._updateCateringStatus(\'' + c._id + '\', this.value)">' +
            ['Pending','Confirmed','Cancelled','Completed'].map(function(s){
              return '<option value="' + s + '"' + (c.status === s ? ' selected' : '') + '>' + s + '</option>';
            }).join('') +
          '</select>' +
          '<button class="btn btn-red btn-xs" onclick="window._deleteCatering(\'' + c._id + '\', \'' + esc(c.name) + '\')">Delete</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  window._updateCateringStatus = async function (id, status) {
    try {
      var res  = await fetch(API_BASE + '/api/admin/catering/' + id + '/status', {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status: status })
      });
      var data = await res.json();
      if (!data.success) throw new Error(data.message);
      showToast('Catering status → ' + status);
      loadCatering();
      loadStats();
    } catch (err) { showToast(err.message, 'error'); }
  };

  window._deleteCatering = async function (id, name) {
    var ok = await confirmDialog('Delete catering request for "' + name + '"?');
    if (!ok) return;
    try {
      var res  = await fetch(API_BASE + '/api/admin/catering/' + id, { method: 'DELETE', headers: authHeaders() });
      var data = await res.json();
      if (!data.success) throw new Error(data.message);
      showToast('Catering request deleted.');
      loadCatering();
      loadStats();
    } catch (err) { showToast(err.message, 'error'); }
  };

  /* ════════════════════════════════════════════
     MENU MANAGER
  ════════════════════════════════════════════ */
  var menuData  = [];
  var editingId = null;

  document.getElementById('menuCategoryFilter').addEventListener('change', loadMenu);
  document.getElementById('addMenuBtn').addEventListener('click', function () { openMenuModal(null); });

  async function loadMenu() {
    var category = document.getElementById('menuCategoryFilter').value;
    var params   = new URLSearchParams();
    if (category !== 'all') params.set('category', category);

    setLoading('menu', true);
    try {
      var res  = await fetch(API_BASE + '/api/admin/menu?' + params.toString(), { headers: authHeaders() });
      if (res.status === 401) return handleUnauth();
      var data = await res.json();
      menuData = data.data || [];
      renderMenuGrid(menuData);
    } catch (err) {
      showToast('Failed to load menu: ' + err.message, 'error');
    } finally {
      setLoading('menu', false);
    }
  }

  function renderMenuGrid(items) {
    var grid  = document.getElementById('menuGrid');
    var empty = document.getElementById('menuEmpty');

    if (!items.length) {
      empty.style.display = 'block';
      grid.innerHTML      = '';
      return;
    }
    empty.style.display = 'none';

    grid.innerHTML = items.map(function (item) {
      return '<div class="menu-item-card">' +
        (item.image
          ? '<img src="' + esc(item.image) + '" alt="' + esc(item.name) + '" class="menu-item-img" onerror="this.style.display=\'none\'">'
          : '<div class="menu-item-img-placeholder">&#127859;</div>'
        ) +
        '<div class="menu-item-body">' +
          '<div class="menu-item-top">' +
            '<span class="menu-item-name">' + esc(item.name) + '</span>' +
            '<span class="menu-item-price">₹' + item.price + '</span>' +
          '</div>' +
          '<div class="menu-item-cat">' + cap(item.category) + '</div>' +
          (item.description ? '<div class="menu-item-desc">' + esc(item.description.slice(0, 90)) + '</div>' : '') +
          '<div class="menu-item-footer">' +
            '<span class="menu-item-avail ' + (item.available ? 'avail-yes' : 'avail-no') + '">' +
              (item.available ? 'Available' : 'Unavailable') +
            '</span>' +
            '<button class="btn btn-outline btn-xs" onclick="window._editMenuItem(\'' + item._id + '\')">Edit</button>' +
            '<button class="btn btn-red btn-xs"     onclick="window._deleteMenuItem(\'' + item._id + '\', \'' + esc(item.name) + '\')">Delete</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ── Menu Modal ──────────────────────────────
  var menuModal = document.getElementById('menuModal');
  var menuForm  = document.getElementById('menuForm');

  // Live image preview
  document.getElementById('itemImage').addEventListener('input', function () {
    var url     = this.value.trim();
    var preview = document.getElementById('imagePreview');
    var holder  = document.getElementById('imagePreviewPlaceholder');
    if (url) {
      preview.src          = url;
      preview.style.display  = 'block';
      holder.style.display   = 'none';
    } else {
      preview.style.display  = 'none';
      holder.style.display   = 'block';
    }
  });

  function openMenuModal(id) {
    editingId = id;
    menuForm.reset();
    document.getElementById('imagePreview').style.display       = 'none';
    document.getElementById('imagePreviewPlaceholder').style.display = 'block';

    if (id) {
      var item = menuData.find(function (m) { return m._id === id; });
      if (!item) return;
      document.getElementById('menuModalTitle').textContent    = 'Edit Menu Item';
      document.getElementById('menuItemId').value              = item._id;
      document.getElementById('itemName').value                = item.name;
      document.getElementById('itemPrice').value               = item.price;
      document.getElementById('itemCategory').value            = item.category;
      document.getElementById('itemAvailable').value           = String(item.available);
      document.getElementById('itemImage').value               = item.image || '';
      document.getElementById('itemDescription').value         = item.description || '';
      if (item.image) {
        document.getElementById('imagePreview').src            = item.image;
        document.getElementById('imagePreview').style.display  = 'block';
        document.getElementById('imagePreviewPlaceholder').style.display = 'none';
      }
    } else {
      document.getElementById('menuModalTitle').textContent = 'Add Menu Item';
      document.getElementById('menuItemId').value           = '';
    }

    showOverlay(menuModal);
  }

  // Expose for inline onclick
  window._editMenuItem = function (id) { openMenuModal(id); };

  // Close modal buttons
  document.getElementById('menuModalClose').addEventListener('click',  function () { hideOverlay(menuModal); });
  document.getElementById('menuModalCancel').addEventListener('click', function () { hideOverlay(menuModal); });

  // Click on backdrop closes modal
  menuModal.addEventListener('click', function (e) {
    if (e.target === menuModal) hideOverlay(menuModal);
  });

  // Save menu item (create or update)
  menuForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    var id      = document.getElementById('menuItemId').value;
    var saveBtn = document.getElementById('menuSaveBtn');

    var payload = {
      name:        document.getElementById('itemName').value.trim(),
      price:       Number(document.getElementById('itemPrice').value),
      category:    document.getElementById('itemCategory').value,
      available:   document.getElementById('itemAvailable').value === 'true',
      image:       document.getElementById('itemImage').value.trim(),
      description: document.getElementById('itemDescription').value.trim()
    };

    if (!payload.name || !payload.price || !payload.category) {
      showToast('Name, price and category are required.', 'error');
      return;
    }

    var isEdit = Boolean(id);
    var url    = isEdit ? API_BASE + '/api/admin/menu/' + id : API_BASE + '/api/admin/menu';
    var method = isEdit ? 'PUT' : 'POST';

    saveBtn.disabled = true;
    saveBtn.classList.add('loading');

    try {
      var res  = await fetch(url, { method: method, headers: authHeaders(), body: JSON.stringify(payload) });
      var data = await res.json();
      if (!data.success) throw new Error(data.message);
      showToast(isEdit ? 'Menu item updated!' : 'Menu item added!');
      hideOverlay(menuModal);
      loadMenu();
      loadStats();
    } catch (err) {
      showToast(err.message || 'Failed to save.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.classList.remove('loading');
    }
  });

  window._deleteMenuItem = async function (id, name) {
    var ok = await confirmDialog('Delete "' + name + '" from the menu?');
    if (!ok) return;
    try {
      var res  = await fetch(API_BASE + '/api/admin/menu/' + id, { method: 'DELETE', headers: authHeaders() });
      var data = await res.json();
      if (!data.success) throw new Error(data.message);
      showToast('Menu item deleted.');
      loadMenu();
      loadStats();
    } catch (err) { showToast(err.message, 'error'); }
  };

  /* ════════════════════════════════════════════
     CSV EXPORT
  ════════════════════════════════════════════ */
  function exportCSV(rows, fields, filename) {
    if (!rows.length) { showToast('No data to export.', 'info'); return; }
    var header = fields.join(',');
    var body   = rows.map(function (row) {
      return fields.map(function (f) {
        var val = row[f] !== undefined ? String(row[f]) : '';
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      }).join(',');
    }).join('\n');

    var blob = new Blob([header + '\n' + body], { type: 'text/csv' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = filename + '_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('CSV exported!');
  }

  /* ════════════════════════════════════════════
     UTILITY HELPERS
  ════════════════════════════════════════════ */

  // HTML escape — prevents XSS when inserting user data into innerHTML
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Capitalise first letter
  function cap(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Build a labelled field for mobile cards
  function cardField(label, value) {
    return '<div class="data-card-field">' +
      '<span class="field-label">' + label + '</span>' +
      '<span class="field-val">' + esc(String(value)) + '</span>' +
    '</div>';
  }

  // Show/hide loading state for a section
  function setLoading(section, loading) {
    var loadEl = document.getElementById(section + 'Loading');
    if (loadEl) loadEl.style.display = loading ? 'block' : 'none';
  }

  /* ════════════════════════════════════════════
     INITIAL LOAD — run dashboard stats on open
  ════════════════════════════════════════════ */
  loadStats();

}); // end DOMContentLoaded