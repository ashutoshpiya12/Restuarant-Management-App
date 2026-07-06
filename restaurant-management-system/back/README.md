# Restaurant Management System — Backend (Django)

REST API for the restaurant site and the custom admin panel.

## Setup

```bash
cd back
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser   # create your admin login (mark as staff)

python manage.py runserver
```

The API runs at `http://127.0.0.1:8000/api/`.

## Auth

- `POST /api/auth/login/` — body `{ "username": "...", "password": "..." }` → returns `access`, `refresh`, and `user` (with `is_staff`).
- `POST /api/auth/refresh/` — body `{ "refresh": "..." }` → returns new `access` token.
- `GET /api/auth/me/` — current logged-in user (send `Authorization: Bearer <access>`).

Only users with `is_staff = True` can create/edit/delete categories, menu items, tables, and can view the Users list — this is what powers the custom admin panel. Anyone can read the public menu (`GET` categories/menu-items) without logging in.

## Endpoints

| Endpoint | Methods | Notes |
|---|---|---|
| `/api/categories/` | GET, POST, PUT, DELETE | Food categories |
| `/api/menu-items/` | GET, POST, PUT, DELETE | Supports `?category=<id>` and `?available=true` filters |
| `/api/tables/` | GET, POST, PUT, DELETE | Staff only |
| `/api/orders/` | GET, POST, PUT, DELETE | Customers see only their own; staff see all |
| `/api/users/` | GET, POST, PUT, DELETE | Staff only — powers the admin panel's Users screen |
| `/api/dashboard/stats/` | GET | Staff only — counts for the admin dashboard cards |

## Django admin (built-in, separate from the custom panel)

Visit `http://127.0.0.1:8000/admin/` and log in with your superuser account if you also want Django's default admin UI.
