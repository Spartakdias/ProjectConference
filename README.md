# ConfHub — Conference Management Website

Multi-page website for browsing conferences, registering for them and managing bookings.
Built with plain **HTML, CSS and JavaScript** for the Web Programming course.

## How to run
Open `index.html` in a browser (or use VS Code **Live Server**). No installation or server is needed.

## Demo accounts
| Role | Email | Password |
|---|---|---|
| Administrator | admin@confhub.com | admin123 |
| User | register your own on the Register page | min. 6 characters |

## Features
- Registration (first/last name, email, optional phone and date of birth, password + confirmation) and login
- Home page with logo, navigation, call-to-action, user info and logout
- Conference catalog with 8 cards, **search** and **filters** (category, city)
- Details page with description, features and program
- Booking form (ticket type, quantity, phone, notes) and confirmation with a Booking ID
- User profile: personal data, **edit profile**, booking history, cancel booking, logout
- **Admin panel**: dashboard, users list, conferences **CRUD** (add / edit / delete), bookings list with status change
- Form validation with clear messages on every form (empty fields, invalid email, short password,
  passwords mismatch, duplicate email, invalid phone, invalid date, invalid quantity, not enough seats, ...)
- Responsive design (desktop, tablet, mobile menu), consistent header, footer and styles on all pages

## Project structure
```
ProjectConference/
├── index.html          home page
├── conferences.html    catalog + search/filters
├── details.html        conference details (?id=)
├── booking.html        booking form + confirmation (?id=)
├── login.html
├── register.html
├── profile.html
├── admin.html          admin only
├── about.html          about, contact, privacy, terms
├── css/style.css       all colors are CSS variables in :root
├── images/             hero.jpg and conf-1.jpg ... conf-8.jpg (photos)
└── js/
    ├── storage.js      localStorage data layer + seed data
    ├── validation.js   form validation
    ├── auth.js         register / login / logout / access control
    └── main.js         header, footer and logic of every page
```

## Technologies shown
- **HTML:** semantic tags, forms, links, lists, tables
- **CSS:** selectors, box model, Flexbox, Grid, media queries, hover effects, transitions
- **JavaScript:** variables, functions, conditions, events, DOM manipulation, form validation, dynamic content

## Important
This is a browser-only educational demo. All data (including passwords) is stored unencrypted in
`localStorage` of your browser and is **not secure**. Do not use real passwords.
To reset all data, clear the site's localStorage in browser DevTools.

## Credits
Photos: [Unsplash](https://unsplash.com) (free license).
