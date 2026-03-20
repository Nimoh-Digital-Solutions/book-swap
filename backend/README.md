# bookswap

An app for booklovers to save on buying new books everytime they want read new books

Powered by [nimoh-be-django-base](https://github.com/ThriledLokki983/nimoh-be-django-base).

## Quick Start

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in SECRET_KEY, DATABASE_URL, etc.
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Project layout

```
bookswap/          # Custom User model (subclasses AbstractNimohUser)
config/
  settings/
    base.py         # Shared settings (uses NimohBaseSettings helpers)
    development.py  # DEBUG=True, console email
    production.py   # HTTPS security, WhiteNoise static
    test.py         # SQLite :memory:, fast password hashing
  urls.py
  wsgi.py / asgi.py
manage.py
```

## Customising the User model

Edit `bookswap/models.py` to add fields **before** the first migration:

```python
from nimoh_base.auth.models import AbstractNimohUser

class User(AbstractNimohUser):
    bio = models.TextField(blank=True)
    # … add more fields here

    class Meta(AbstractNimohUser.Meta):
        db_table = 'bookswap_user'
        swappable = 'AUTH_USER_MODEL'
```

Then run `python manage.py makemigrations && python manage.py migrate`.

> **Warning:** Changing `AUTH_USER_MODEL` after the first `migrate` destroys migration history.
> Get it right now.

## NIMOH_BASE settings

All package-runtime config lives in the `NIMOH_BASE` dict (see `config/settings/base.py`).
Required keys: `SITE_NAME`, `SUPPORT_EMAIL`, `NOREPLY_EMAIL`.

Full reference: `python -c "from nimoh_base.conf.defaults import NIMOH_BASE_SCHEMA; [print(e['key'], '-', e['description']) for e in NIMOH_BASE_SCHEMA]"`

## API docs

After `runserver`, visit:
- Swagger UI: http://localhost:8000/api/schema/swagger-ui/
- ReDoc:       http://localhost:8000/api/schema/redoc/

## Auth endpoints

Provided by `nimoh_base.auth` (mounted at `/api/v1/auth/`):

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register/` | Create account |
| POST | `/api/v1/auth/login/` | JWT login |
| POST | `/api/v1/auth/token/refresh/` | Refresh access token |
| POST | `/api/v1/auth/logout/` | Blacklist refresh token |
| POST | `/api/v1/auth/email-verify/` | Verify email address |
| POST | `/api/v1/auth/password/reset/` | Request password reset |

## Running with Docker

```bash
cp .env.example .env
docker compose up --build
```

## Author

Gideon Nimoh <gnimoh001@gmail.com>
