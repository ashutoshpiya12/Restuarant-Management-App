# Restaurant Management System — Frontend (React + Bootstrap)

Public restaurant site (Home, Menu) plus a custom admin panel (Dashboard,
Categories, Menu Items, Users) that talks to the Django backend in `../back`.

## Setup

```bash
cd front
npm install
npm start
```

Runs at `http://localhost:3000`. Make sure the Django backend is running at
`http://127.0.0.1:8000` (see `../back/README.md`), or set a custom API URL by
creating a `.env` file:

```
REACT_APP_API_URL=http://127.0.0.1:8000/api
```

## Structure

```
src/
  api/
    axios.js        API client with JWT auth + auto token refresh
    AuthContext.js  Login state shared across the app
  components/        Navbar, Footer, ProtectedRoute (guards admin pages)
  pages/              Public site: Home, Menu
  admin/              Custom admin panel: Login, Dashboard, Categories,
                       Menu Items, Users
  styles/theme.css    Design tokens (colors, type, admin/site styling)
```

## Admin panel access

Log in at `/admin/login` with a Django user that has `is_staff = True`
(create one on the backend with `python manage.py createsuperuser`, or
promote an existing user from the Users screen once you have at least one
staff account). From there you can:

- **Dashboard** — quick counts of categories, menu items, users, orders.
- **Categories** — add/edit/delete food categories.
- **Menu Items** — add/edit/delete dishes, assign to a category, set price
  and availability.
- **Users** — view registered users, grant/revoke admin access, activate or
  deactivate accounts.
