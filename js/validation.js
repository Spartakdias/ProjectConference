/* ConfHub – form validation */
const Validate = {
  required: (v) => String(v).trim() !== '',
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()),
  phone: (v) => /^\+?[0-9\s\-()]{10,16}$/.test(String(v).trim()),
  date: (v) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const d = new Date(v);
    return !isNaN(d) && d.toISOString().slice(0, 10) === v;
  }
};

function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

/* ---------- error display ---------- */
function clearError(input) {
  input.classList.remove('invalid');
  const next = input.nextElementSibling;
  if (next && next.classList.contains('field-error')) next.remove();
}

function setError(input, message) {
  clearError(input);
  input.classList.add('invalid');
  const small = document.createElement('small');
  small.className = 'field-error';
  small.textContent = message;
  input.insertAdjacentElement('afterend', small);
}

function showFormMessage(form, text, type) {
  const box = $('.form-message', form);
  if (!box) return;
  box.textContent = text;
  box.className = 'form-message ' + (type || 'error');
}

function clearErrors(form) {
  $$('input, select, textarea', form).forEach(clearError);
  showFormMessage(form, '');
}

function liveClear(form) {
  form.addEventListener('input', (e) => clearError(e.target));
}

/* runs checks and collects the result */
function makeChecker(form) {
  clearErrors(form);
  const state = { ok: true };
  state.fail = (el, msg) => { setError(el, msg); state.ok = false; };
  return state;
}

/* ---------- validators ---------- */
function validateRegister(form) {
  const v = makeChecker(form);
  const f = form.elements;

  const requiredNames = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
  const allEmpty = requiredNames.every((n) => !Validate.required(f[n].value));

  if (!Validate.required(f.firstName.value)) v.fail(f.firstName, 'First name is required.');
  else if (f.firstName.value.trim().length < 2) v.fail(f.firstName, 'First name must be at least 2 characters.');

  if (!Validate.required(f.lastName.value)) v.fail(f.lastName, 'Last name is required.');
  else if (f.lastName.value.trim().length < 2) v.fail(f.lastName, 'Last name must be at least 2 characters.');

  if (!Validate.required(f.email.value)) v.fail(f.email, 'Email is required.');
  else if (!Validate.email(f.email.value)) v.fail(f.email, 'Please enter a valid email (example: student@email.com).');

  if (Validate.required(f.phone.value) && !Validate.phone(f.phone.value)) {
    v.fail(f.phone, 'Invalid phone number. Use 10–15 digits, e.g. +77001234567.');
  }

  if (Validate.required(f.dob.value)) {
    if (!Validate.date(f.dob.value)) v.fail(f.dob, 'Invalid date of birth.');
    else if (f.dob.value > todayStr()) v.fail(f.dob, 'Date of birth cannot be in the future.');
    else if (f.dob.value < '1900-01-01') v.fail(f.dob, 'Please enter a realistic date of birth.');
  }

  if (!Validate.required(f.password.value)) v.fail(f.password, 'Password is required.');
  else if (f.password.value.length < 6) v.fail(f.password, 'Password must be at least 6 characters.');

  if (!Validate.required(f.confirmPassword.value)) v.fail(f.confirmPassword, 'Please confirm your password.');
  else if (f.confirmPassword.value !== f.password.value) v.fail(f.confirmPassword, 'Passwords do not match.');

  if (allEmpty) showFormMessage(form, 'The form is empty. Please fill in all required fields.');
  else if (!v.ok) showFormMessage(form, 'Please fix the highlighted fields.');
  return v.ok;
}

function validateLogin(form) {
  const v = makeChecker(form);
  const f = form.elements;

  if (!Validate.required(f.email.value) && !Validate.required(f.password.value)) {
    showFormMessage(form, 'Please enter your email and password.');
  }
  if (!Validate.required(f.email.value)) v.fail(f.email, 'Email is required.');
  else if (!Validate.email(f.email.value)) v.fail(f.email, 'Please enter a valid email.');
  if (!Validate.required(f.password.value)) v.fail(f.password, 'Password is required.');
  return v.ok;
}

function validateBooking(form, conf) {
  const v = makeChecker(form);
  const f = form.elements;

  if (!Validate.required(f.ticketType.value)) v.fail(f.ticketType, 'Please select a ticket type.');

  const qty = Number(f.tickets.value);
  if (!Validate.required(f.tickets.value) || !Number.isInteger(qty) || qty < 1 || qty > 10) {
    v.fail(f.tickets, 'Invalid quantity. Enter a whole number from 1 to 10.');
  } else if (qty > seatsLeft(conf)) {
    v.fail(f.tickets, 'Not enough seats. Only ' + seatsLeft(conf) + ' left.');
  }

  if (Validate.required(f.phone.value) && !Validate.phone(f.phone.value)) {
    v.fail(f.phone, 'Invalid phone number. Use 10–15 digits, e.g. +77001234567.');
  }
  if (f.notes.value.length > 300) v.fail(f.notes, 'Additional information must be 300 characters or fewer.');

  if (!v.ok) showFormMessage(form, 'Please fix the highlighted fields.');
  return v.ok;
}

function validateProfile(form) {
  const v = makeChecker(form);
  const f = form.elements;

  if (!Validate.required(f.firstName.value)) v.fail(f.firstName, 'First name is required.');
  else if (f.firstName.value.trim().length < 2) v.fail(f.firstName, 'First name must be at least 2 characters.');
  if (!Validate.required(f.lastName.value)) v.fail(f.lastName, 'Last name is required.');
  else if (f.lastName.value.trim().length < 2) v.fail(f.lastName, 'Last name must be at least 2 characters.');
  if (Validate.required(f.phone.value) && !Validate.phone(f.phone.value)) v.fail(f.phone, 'Invalid phone number.');
  if (Validate.required(f.dob.value)) {
    if (!Validate.date(f.dob.value)) v.fail(f.dob, 'Invalid date of birth.');
    else if (f.dob.value > todayStr()) v.fail(f.dob, 'Date of birth cannot be in the future.');
  }
  if (!v.ok) showFormMessage(form, 'Please fix the highlighted fields.');
  return v.ok;
}

function validateConference(form) {
  const v = makeChecker(form);
  const f = form.elements;

  if (!Validate.required(f.title.value)) v.fail(f.title, 'Title is required.');
  else if (f.title.value.trim().length < 3) v.fail(f.title, 'Title must be at least 3 characters.');
  if (!Validate.required(f.category.value)) v.fail(f.category, 'Category is required.');
  if (!Validate.required(f.city.value)) v.fail(f.city, 'City is required.');
  if (!Validate.required(f.speaker.value)) v.fail(f.speaker, 'Speaker is required.');

  if (!Validate.required(f.date.value)) v.fail(f.date, 'Date is required.');
  else if (!Validate.date(f.date.value)) v.fail(f.date, 'Invalid date.');

  const price = Number(f.price.value);
  if (!Validate.required(f.price.value) || isNaN(price) || price < 0) v.fail(f.price, 'Price must be a number 0 or higher.');

  const seats = Number(f.seats.value);
  const sold = f.id.value ? soldTickets(Number(f.id.value)) : 0;
  if (!Validate.required(f.seats.value) || !Number.isInteger(seats) || seats < 1) v.fail(f.seats, 'Seats must be a whole number 1 or higher.');
  else if (seats < sold) v.fail(f.seats, 'Seats cannot be less than tickets already booked (' + sold + ').');

  if (!Validate.required(f.description.value)) v.fail(f.description, 'Description is required.');
  else if (f.description.value.trim().length < 10) v.fail(f.description, 'Description must be at least 10 characters.');

  if (!v.ok) showFormMessage(form, 'Please fix the highlighted fields.');
  return v.ok;
}
