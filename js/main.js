/* ConfHub – page logic (header/footer, rendering, forms) */
const PAGE_ALIAS = { details: 'conferences', booking: 'conferences' };

/* ---------- shared header + footer ---------- */
function renderLayout() {
  const user = Auth.current();
  const page = document.body.dataset.page;
  const active = PAGE_ALIAS[page] || page;
  const link = (key, href, label) =>
    '<a href="' + href + '"' + (key === active ? ' class="active" aria-current="page"' : '') + '>' + label + '</a>';

  let nav = link('home', 'index.html', 'Home') + link('conferences', 'conferences.html', 'Conferences') + link('about', 'about.html', 'About');
  if (user) nav += link('profile', 'profile.html', 'Profile');
  if (user && user.role === 'admin') nav += link('admin', 'admin.html', 'Admin');
  if (user) {
    nav += '<span class="user-chip">👤 ' + esc(user.firstName) + '</span>' +
           '<button type="button" class="nav-btn" id="logoutBtn">Logout</button>';
  } else {
    nav += link('login', 'login.html', 'Login') + link('register', 'register.html', 'Register');
  }

  const header = $('#site-header');
  if (header) {
    header.innerHTML =
      '<a class="logo" href="index.html">🎤 ConfHub</a>' +
      '<button type="button" class="menu-toggle" id="menuToggle" aria-label="Toggle menu" aria-expanded="false">☰</button>' +
      '<nav id="mainNav" aria-label="Main navigation">' + nav + '</nav>';
    $('#menuToggle').addEventListener('click', () => {
      const open = $('#mainNav').classList.toggle('open');
      $('#menuToggle').setAttribute('aria-expanded', String(open));
    });
    const logout = $('#logoutBtn');
    if (logout) logout.addEventListener('click', Auth.logout);
  }

  const footer = $('#site-footer');
  if (footer) {
    footer.innerHTML =
      '<div class="footer-links"><a href="about.html">About</a><a href="about.html#contact">Contact</a>' +
      '<a href="about.html#privacy">Privacy</a><a href="about.html#terms">Terms</a></div>' +
      '<div class="footer-links"><a href="https://instagram.com" target="_blank" rel="noopener">Instagram</a>' +
      '<a href="https://facebook.com" target="_blank" rel="noopener">Facebook</a>' +
      '<a href="https://telegram.org" target="_blank" rel="noopener">Telegram</a></div>' +
      '<p>© 2026 ConfHub · Student Project</p>';
  }
}

/* ---------- reusable pieces ---------- */
function photoBlock(c, boxClass) {
  const cls = c.category.toLowerCase().replace(/[^a-z]/g, '');
  const src = confImage(c);
  return '<div class="' + boxClass + ' cat-' + cls + '">' + categoryIcon(c.category) +
    (src ? '<img src="' + esc(src) + '" alt="' + esc(c.title) + '" loading="lazy" onerror="this.remove()">' : '') +
    '</div>';
}

function conferenceCard(c) {
  return '<article class="card">' +
    photoBlock(c, 'card-photo') +
    '<span class="tag">' + esc(c.category) + '</span>' +
    '<h3>' + esc(c.title) + '</h3>' +
    '<p class="muted">📍 ' + esc(c.city) + ' · 📅 ' + formatDate(c.date) + '</p>' +
    '<p class="price">$' + esc(c.price) + '</p>' +
    '<a class="btn" href="details.html?id=' + c.id + '">View Details</a>' +
    '</article>';
}

function notFound(box, text, hint) {
  box.innerHTML = '<div class="card center"><h1>' + esc(text) + '</h1>' +
    '<p class="muted">' + esc(hint || 'The conference may have been removed.') + '</p>' +
    '<a class="btn" href="conferences.html">Back to conferences</a></div>';
}

function statusBadge(status) {
  return '<span class="badge ' + status.toLowerCase() + '">' + esc(status) + '</span>';
}

/* ---------- pages ---------- */
const pages = {};

pages.home = () => {
  const user = Auth.current();
  const welcome = $('#welcome');
  const cta = $('#ctaBtn');
  if (user) {
    welcome.textContent = 'Welcome back, ' + user.firstName + '!';
    cta.textContent = 'Browse conferences';
    cta.href = 'conferences.html';
  } else {
    cta.textContent = 'Get started';
    cta.href = 'register.html';
  }
  const upcoming = getConferences().slice().sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  $('#upcomingCards').innerHTML = upcoming.map(conferenceCard).join('');
};

pages.conferences = () => {
  const all = getConferences();
  const form = $('#filters');
  const search = $('#search');
  const category = $('#category');
  const city = $('#city');
  const unique = (arr) => Array.from(new Set(arr)).sort();
  const fill = (select, values, label) => {
    select.innerHTML = '<option value="">' + label + '</option>' +
      values.map((v) => '<option value="' + esc(v) + '">' + esc(v) + '</option>').join('');
  };
  fill(category, unique(all.map((c) => c.category)), 'All categories');
  fill(city, unique(all.map((c) => c.city)), 'All cities');

  const render = () => {
    const q = search.value.trim().toLowerCase();
    const list = all.filter((c) =>
      (!q || [c.title, c.speaker, c.city, c.category].some((t) => t.toLowerCase().includes(q))) &&
      (!category.value || c.category === category.value) &&
      (!city.value || c.city === city.value)
    );
    $('#conferenceCards').innerHTML = list.map(conferenceCard).join('');
    $('#resultCount').textContent = list.length + ' conference' + (list.length === 1 ? '' : 's') + ' found';
    $('#noResults').hidden = list.length > 0;
  };

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('reset', () => setTimeout(render, 0));
  render();
};

pages.details = () => {
  const box = $('#detail');
  const id = Number(new URLSearchParams(location.search).get('id'));
  const c = getConferences().find((x) => x.id === id);
  if (!c) { notFound(box, 'Conference not found'); return; }

  document.title = c.title + ' | ConfHub';
  const left = seatsLeft(c);
  const action = left > 0
    ? '<a class="btn" href="booking.html?id=' + c.id + '">Register for Conference</a>'
    : '<button class="btn" disabled>Sold out</button>';

  box.innerHTML =
    photoBlock(c, 'detail-photo') +
    '<span class="tag">' + esc(c.category) + '</span>' +
    '<h1>' + esc(c.title) + '</h1>' +
    '<p>' + esc(c.description) + '</p>' +
    '<h3>Conference Information</h3>' +
    '<p>Location: ' + esc(c.city) + ', Kazakhstan</p>' +
    '<p>Date: ' + formatDate(c.date) + '</p>' +
    '<p>Speaker: ' + esc(c.speaker) + '</p>' +
    '<p>Seats left: ' + left + ' of ' + c.seats + '</p>' +
    '<h3>Features</h3>' +
    '<ul class="checks">' + (c.features || DEFAULT_FEATURES).map((f) => '<li>✓ ' + esc(f) + '</li>').join('') + '</ul>' +
    '<div class="schedule"><h2>Conference Program</h2>' +
    (c.program || []).map((p) => '<p>' + esc(p) + '</p>').join('') + '</div>' +
    '<p class="price big">Price: $' + esc(c.price) + '</p>' + action;
};

pages.register = () => {
  if (Auth.current()) { location.href = 'index.html'; return; }
  const form = $('#registerForm');
  liveClear(form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateRegister(form)) return;
    const f = form.elements;
    const res = Auth.register({
      firstName: f.firstName.value.trim(),
      lastName: f.lastName.value.trim(),
      email: f.email.value.trim().toLowerCase(),
      phone: f.phone.value.trim(),
      dob: f.dob.value,
      password: f.password.value
    });
    if (!res.ok) {
      setError(f.email, res.error);
      showFormMessage(form, res.error);
      return;
    }
    location.href = 'login.html?registered=1';
  });
};

pages.login = () => {
  if (Auth.current()) { location.href = 'index.html'; return; }
  const form = $('#loginForm');
  const params = new URLSearchParams(location.search);
  liveClear(form);
  if (params.get('registered')) showFormMessage(form, 'Account created successfully! Please log in.', 'success');

  $('#forgotLink').addEventListener('click', (e) => {
    e.preventDefault();
    showFormMessage(form, 'Password reset is not available in this demo version.', 'info');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateLogin(form)) return;
    const res = Auth.login(form.elements.email.value, form.elements.password.value);
    if (!res.ok) { setError(form.elements[res.field], res.error); return; }
    const next = params.get('next');
    location.href = next && /^[a-z]+\.html(\?[\w=&%-]*)?$/i.test(next) ? next : 'index.html';
  });
};

pages.booking = () => {
  const user = Auth.requireLogin();
  if (!user) return;
  const box = $('#bookingBox');
  const id = Number(new URLSearchParams(location.search).get('id'));
  const conf = getConferences().find((c) => c.id === id);
  if (!conf) { notFound(box, 'Conference not found'); return; }
  document.title = 'Register – ' + conf.title + ' | ConfHub';

  const left = seatsLeft(conf);
  if (left <= 0) { notFound(box, 'Sorry, this conference is sold out', 'All seats are booked. Please choose another event.'); return; }

  box.innerHTML =
    '<form class="panel" id="bookingForm" novalidate>' +
    '<h1>Booking Form</h1>' +
    '<h3>' + esc(conf.title) + '</h3>' +
    '<p class="muted">📍 ' + esc(conf.city) + ' · Seats left: ' + left + '</p>' +
    '<p class="form-message"></p>' +
    '<label>Date<input type="text" value="' + formatDate(conf.date) + '" readonly></label>' +
    '<label>Ticket type<select name="ticketType">' +
    '<option value="Standard">Standard – $' + conf.price + '</option>' +
    '<option value="VIP">VIP – $' + conf.price * 2 + '</option></select></label>' +
    '<label>Number of tickets<input type="number" name="tickets" value="1" min="1" max="10"></label>' +
    '<label>Phone (optional)<input type="tel" name="phone" value="' + esc(user.phone) + '" placeholder="+77001234567"></label>' +
    '<label>Additional information<textarea name="notes" rows="3" placeholder="Anything we should know?"></textarea></label>' +
    '<p class="total" id="total"></p>' +
    '<button class="btn" type="submit">CONFIRM</button></form>';

  const form = $('#bookingForm');
  const unitPrice = () => (form.elements.ticketType.value === 'VIP' ? conf.price * 2 : conf.price);
  const updateTotal = () => {
    const q = Number(form.elements.tickets.value);
    $('#total').textContent = Number.isInteger(q) && q > 0 ? 'Total: $' + q * unitPrice() : 'Total: —';
  };
  liveClear(form);
  form.addEventListener('input', updateTotal);
  form.addEventListener('change', updateTotal);
  updateTotal();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateBooking(form, conf)) return;

    const bookings = getBookings();
    if (bookings.some((b) => b.userEmail === user.email && b.conferenceId === conf.id && b.status !== 'Cancelled')) {
      showFormMessage(form, 'You are already registered for this conference. See "My bookings" in your profile.');
      return;
    }
    const qty = Number(form.elements.tickets.value);
    const booking = {
      id: nextId(bookings, 10001),
      userEmail: user.email,
      conferenceId: conf.id,
      conferenceTitle: conf.title,
      conferenceDate: conf.date,
      ticketType: form.elements.ticketType.value,
      tickets: qty,
      total: qty * unitPrice(),
      phone: form.elements.phone.value.trim(),
      notes: form.elements.notes.value.trim(),
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };
    bookings.push(booking);
    saveBookings(bookings);

    box.innerHTML =
      '<div class="panel center success-box">' +
      '<div class="big-check">✓</div><h1>SUCCESS</h1>' +
      '<p>Your booking is confirmed!</p>' +
      '<p class="muted">Booking ID: <strong>#' + booking.id + '</strong><br>' +
      esc(conf.title) + '<br>Date: ' + formatDate(conf.date) + '<br>' +
      booking.tickets + ' × ' + booking.ticketType + ' · Total: $' + booking.total + '</p>' +
      '<a class="btn" href="profile.html#bookings">VIEW MY BOOKINGS</a></div>';
  });
};

pages.profile = () => {
  const user = Auth.requireLogin();
  if (!user) return;
  const editForm = $('#editForm');
  const info = $('#profileInfo');
  const tbody = $('#bookingRows');

  const draw = () => {
    const u = Auth.current();
    info.innerHTML =
      '<div class="avatar">' + esc((u.firstName[0] || '') + (u.lastName[0] || '')).toUpperCase() + '</div>' +
      '<h2>' + esc(u.firstName + ' ' + u.lastName) + '</h2>' +
      '<p>Email: ' + esc(u.email) + '</p>' +
      '<p>Phone: ' + esc(u.phone || '—') + '</p>' +
      '<p>Date of birth: ' + (u.dob ? formatDate(u.dob) : '—') + '</p>' +
      '<p>Account type: ' + (u.role === 'admin' ? 'Administrator' : 'Participant') + '</p>';

    const mine = getBookings().filter((b) => b.userEmail === u.email).sort((a, b) => b.id - a.id);
    $('#noBookings').hidden = mine.length > 0;
    $('#bookingTable').hidden = mine.length === 0;
    tbody.innerHTML = mine.map((b) =>
      '<tr><td>#' + b.id + '</td><td>' + esc(b.conferenceTitle) + '</td><td>' + formatDate(b.conferenceDate) + '</td>' +
      '<td>' + b.tickets + ' (' + esc(b.ticketType) + ')</td><td>$' + b.total + '</td><td>' + statusBadge(b.status) + '</td>' +
      '<td>' + (b.status !== 'Cancelled' ? '<button class="btn small danger" data-cancel="' + b.id + '">Cancel</button>' : '') + '</td></tr>'
    ).join('');
  };
  draw();

  $('#editBtn').addEventListener('click', () => {
    const u = Auth.current();
    const f = editForm.elements;
    f.firstName.value = u.firstName; f.lastName.value = u.lastName;
    f.phone.value = u.phone || ''; f.dob.value = u.dob || '';
    clearErrors(editForm);
    $('#profileMsg').textContent = '';
    editForm.hidden = false;
  });
  $('#cancelEdit').addEventListener('click', () => { editForm.hidden = true; });
  $('#profileLogout').addEventListener('click', Auth.logout);
  liveClear(editForm);

  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateProfile(editForm)) return;
    const f = editForm.elements;
    const users = getUsers();
    const me = users.find((x) => x.email === user.email);
    me.firstName = f.firstName.value.trim();
    me.lastName = f.lastName.value.trim();
    me.phone = f.phone.value.trim();
    me.dob = f.dob.value;
    saveUsers(users);
    editForm.hidden = true;
    $('#profileMsg').textContent = 'Profile updated successfully.';
    draw();
    renderLayout();
  });

  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cancel]');
    if (!btn || !confirm('Cancel this booking?')) return;
    const bookings = getBookings();
    const b = bookings.find((x) => x.id === Number(btn.dataset.cancel));
    if (b) { b.status = 'Cancelled'; saveBookings(bookings); draw(); }
  });
};

pages.admin = () => {
  if (!Auth.requireAdmin()) return;
  const tabs = $$('[data-tab]');
  const panels = $$('[data-panel]');
  const confForm = $('#confForm');
  const msg = $('#adminMsg');

  const show = (name) => {
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    panels.forEach((p) => { p.hidden = p.dataset.panel !== name; });
  };
  tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.tab)));

  const renderStats = () => {
    const bookings = getBookings();
    const revenue = bookings.filter((b) => b.status === 'Confirmed').reduce((s, b) => s + b.total, 0);
    const stats = [['Users', getUsers().length], ['Conferences', getConferences().length],
                   ['Bookings', bookings.length], ['Revenue', '$' + revenue]];
    $('#stats').innerHTML = stats.map((s) =>
      '<div class="card stat"><span class="muted">' + s[0] + '</span><strong>' + s[1] + '</strong></div>').join('');
  };

  const renderUsers = () => {
    const bookings = getBookings();
    $('#userRows').innerHTML = getUsers().map((u) =>
      '<tr><td>' + u.id + '</td><td>' + esc(u.firstName + ' ' + u.lastName) + '</td><td>' + esc(u.email) + '</td>' +
      '<td>' + esc(u.phone || '—') + '</td><td>' + esc(u.role) + '</td>' +
      '<td>' + bookings.filter((b) => b.userEmail === u.email).length + '</td></tr>').join('');
  };

  const renderConfs = () => {
    $('#confRows').innerHTML = getConferences().map((c) =>
      '<tr><td>' + c.id + '</td><td>' + esc(c.title) + '</td><td>' + esc(c.category) + '</td><td>' + esc(c.city) + '</td>' +
      '<td>' + formatDate(c.date) + '</td><td>$' + esc(c.price) + '</td><td>' + seatsLeft(c) + ' / ' + c.seats + '</td>' +
      '<td class="actions"><button class="btn small" data-edit="' + c.id + '">Edit</button> ' +
      '<button class="btn small danger" data-delete="' + c.id + '">Delete</button></td></tr>').join('');
  };

  const renderBookings = () => {
    const rows = getBookings().slice().sort((a, b) => b.id - a.id);
    $('#noAdminBookings').hidden = rows.length > 0;
    $('#adminBookingRows').innerHTML = rows.map((b) =>
      '<tr><td>#' + b.id + '</td><td>' + esc(b.userEmail) + '</td><td>' + esc(b.conferenceTitle) + '</td>' +
      '<td>' + b.tickets + ' (' + esc(b.ticketType) + ')</td><td>$' + b.total + '</td>' +
      '<td><select data-status="' + b.id + '">' +
      ['Confirmed', 'Pending', 'Cancelled'].map((s) => '<option' + (s === b.status ? ' selected' : '') + '>' + s + '</option>').join('') +
      '</select></td></tr>').join('');
  };

  const renderAll = () => { renderStats(); renderUsers(); renderConfs(); renderBookings(); };

  const openForm = (c) => {
    clearErrors(confForm);
    const f = confForm.elements;
    $('#confFormTitle').textContent = c ? 'Edit conference' : 'Add conference';
    f.id.value = c ? c.id : '';
    f.title.value = c ? c.title : '';
    f.category.value = c ? c.category : '';
    f.city.value = c ? c.city : '';
    f.date.value = c ? c.date : '';
    f.speaker.value = c ? c.speaker : '';
    f.price.value = c ? c.price : '';
    f.seats.value = c ? c.seats : '';
    f.description.value = c ? c.description : '';
    f.image.value = c ? (c.image || '') : '';
    f.program.value = c ? (c.program || []).join('\n') : '';
    confForm.hidden = false;
    confForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  $('#addConfBtn').addEventListener('click', () => openForm(null));
  $('#cancelConf').addEventListener('click', () => { confForm.hidden = true; });
  liveClear(confForm);

  confForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateConference(confForm)) return;
    const f = confForm.elements;
    const list = getConferences();
    const data = {
      title: f.title.value.trim(), category: f.category.value.trim(), city: f.city.value.trim(),
      date: f.date.value, speaker: f.speaker.value.trim(), price: Number(f.price.value),
      seats: Number(f.seats.value), description: f.description.value.trim(),
      image: f.image.value.trim(),
      program: f.program.value.split('\n').map((l) => l.trim()).filter(Boolean)
    };
    if (f.id.value) {
      const idx = list.findIndex((c) => c.id === Number(f.id.value));
      list[idx] = Object.assign({}, list[idx], data);
      msg.textContent = 'Conference updated.';
    } else {
      list.push(Object.assign({ id: nextId(list, 1), features: DEFAULT_FEATURES }, data));
      msg.textContent = 'Conference added.';
    }
    saveConferences(list);
    confForm.hidden = true;
    renderAll();
  });

  $('#confRows').addEventListener('click', (e) => {
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-delete]');
    if (edit) openForm(getConferences().find((c) => c.id === Number(edit.dataset.edit)));
    if (del && confirm('Delete this conference?')) {
      saveConferences(getConferences().filter((c) => c.id !== Number(del.dataset.delete)));
      msg.textContent = 'Conference deleted.';
      renderAll();
    }
  });

  $('#adminBookingRows').addEventListener('change', (e) => {
    const sel = e.target.closest('[data-status]');
    if (!sel) return;
    const bookings = getBookings();
    const b = bookings.find((x) => x.id === Number(sel.dataset.status));
    if (b) { b.status = sel.value; saveBookings(bookings); msg.textContent = 'Booking #' + b.id + ' is now ' + b.status + '.'; renderAll(); }
  });

  renderAll();
  show('dashboard');
};

document.addEventListener('DOMContentLoaded', () => {
  renderLayout();
  const page = document.body.dataset.page;
  if (pages[page]) pages[page]();
});
