/* ConfHub – data layer (browser localStorage) + small helpers */
const KEYS = {
  conferences: 'confhub_conferences',
  users: 'confhub_users',
  bookings: 'confhub_bookings',
  session: 'confhub_session'
};

const DB = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

/* ---------- helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function categoryIcon(cat) {
  return { Technology: '💻', Business: '💼', Science: '🔬' }[cat] || '🎤';
}

/* photo of a conference: own path (admin) or images/conf-<id>.jpg for the 8 default events */
function confImage(c) {
  if (c.image) return c.image;
  return c.id >= 1 && c.id <= 8 ? 'images/conf-' + c.id + '.jpg' : '';
}

function nextId(list, start) {
  return list.reduce((max, x) => Math.max(max, x.id), start - 1) + 1;
}

/* ---------- seed data ---------- */
const DEFAULT_FEATURES = ['Certificate of attendance', 'Networking session', 'Conference materials'];

function makeProgram(topic) {
  return [
    '09:00 - Welcome and Registration',
    '10:00 - Introduction to ' + topic,
    '11:30 - Keynote: ' + topic + ' in practice',
    '13:00 - Lunch break',
    '14:00 - Panel discussion',
    '16:00 - Questions and Networking'
  ];
}

const SEED_CONFERENCES = [
  ['AI Future Summit', 'Technology', 'Almaty', '2026-11-12', 'Amina Lee', 50, 200, 'Explore artificial intelligence and real-world applications. Learn about new technologies and the future of AI.', 'Artificial Intelligence'],
  ['Startup Connect', 'Business', 'Astana', '2026-11-18', 'Daniyar Omarov', 40, 150, 'Meet founders and investors, pitch your idea and learn how to build a startup from scratch.', 'Startups'],
  ['Cyber Security Day', 'Technology', 'Almaty', '2026-12-03', 'Marat Sadykov', 45, 120, 'A full day about modern threats, safe development and protecting company data.', 'Cyber Security'],
  ['Science Forum', 'Science', 'Shymkent', '2026-12-09', 'Dr. Elena Petrova', 30, 180, 'Researchers present new results in physics, biology and chemistry for a wide audience.', 'Modern Science'],
  ['Web Developers Meetup', 'Technology', 'Astana', '2026-12-15', 'Aigerim Nurlan', 25, 100, 'Talks and live coding about HTML, CSS, JavaScript and modern web frameworks.', 'Web Development'],
  ['Business Leaders 2027', 'Business', 'Almaty', '2027-01-22', 'John Carter', 80, 250, 'Leadership, strategy and growth: lessons from executives of leading companies.', 'Leadership'],
  ['Robotics Expo', 'Science', 'Karaganda', '2027-02-06', 'Prof. Kim Sung', 35, 160, 'See the latest robots, meet engineers and try hands-on workshops.', 'Robotics'],
  ['Cloud Tech Conference', 'Technology', 'Astana', '2027-02-20', 'Sara Williams', 60, 220, 'Cloud architecture, DevOps and scalable systems explained by practitioners.', 'Cloud Technologies']
].map((c, i) => ({
  id: i + 1, title: c[0], category: c[1], city: c[2], date: c[3], speaker: c[4],
  price: c[5], seats: c[6], description: c[7], program: makeProgram(c[8]), features: DEFAULT_FEATURES
}));

function initData() {
  if (!DB.get(KEYS.conferences)) DB.set(KEYS.conferences, SEED_CONFERENCES);
  if (!DB.get(KEYS.users)) {
    DB.set(KEYS.users, [{
      id: 1, firstName: 'Admin', lastName: 'ConfHub', email: 'admin@confhub.com',
      password: 'admin123', phone: '', dob: '', role: 'admin'
    }]);
  }
  if (!DB.get(KEYS.bookings)) DB.set(KEYS.bookings, []);
}
initData();

/* ---------- accessors ---------- */
const getConferences = () => DB.get(KEYS.conferences, []);
const saveConferences = (list) => DB.set(KEYS.conferences, list);
const getUsers = () => DB.get(KEYS.users, []);
const saveUsers = (list) => DB.set(KEYS.users, list);
const getBookings = () => DB.get(KEYS.bookings, []);
const saveBookings = (list) => DB.set(KEYS.bookings, list);

function soldTickets(confId) {
  return getBookings()
    .filter((b) => b.conferenceId === confId && b.status !== 'Cancelled')
    .reduce((sum, b) => sum + b.tickets, 0);
}

function seatsLeft(conf) {
  return conf.seats - soldTickets(conf.id);
}
