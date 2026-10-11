/* ConfHub – authentication (demo, localStorage) */
const Auth = {
  current() {
    const email = DB.get(KEYS.session, null);
    if (!email) return null;
    return getUsers().find((u) => u.email === email) || null;
  },

  register(data) {
    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    const user = Object.assign({ id: nextId(users, 1), role: 'user' }, data);
    users.push(user);
    saveUsers(users);
    return { ok: true, user };
  },

  login(email, password) {
    const user = getUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) return { ok: false, field: 'email', error: 'No account found with this email.' };
    if (user.password !== password) return { ok: false, field: 'password', error: 'Incorrect password.' };
    DB.set(KEYS.session, user.email);
    return { ok: true, user };
  },

  logout() {
    localStorage.removeItem(KEYS.session);
    location.href = 'login.html';
  },

  requireLogin() {
    const user = Auth.current();
    if (!user) {
      const here = location.pathname.split('/').pop() + location.search;
      location.href = 'login.html?next=' + encodeURIComponent(here);
      return null;
    }
    return user;
  },

  requireAdmin() {
    const user = Auth.requireLogin();
    if (user && user.role !== 'admin') {
      location.href = 'index.html';
      return null;
    }
    return user;
  }
};
