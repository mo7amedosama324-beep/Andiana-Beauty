"""
Django settings for backend project.

Environment (optional, for hosting):
  DJANGO_SECRET_KEY       — production secret (required when DEBUG=0)
  DJANGO_DEBUG            — 0/false to disable debug
  DJANGO_ALLOWED_HOSTS    — comma-separated hosts
  DJANGO_CORS_ALLOWED_ORIGINS — comma-separated frontend origins (https://...)
  DJANGO_CSRF_TRUSTED_ORIGINS — same style for CSRF
  DJANGO_BEHIND_PROXY     — 1 if behind nginx/caddy (sets SECURE_PROXY_SSL_HEADER)
  DJANGO_COOKIE_SAMESITE  — Lax | Strict | None (None needs HTTPS / secure cookies)
  DJANGO_SECURE_COOKIES   — 1 to force Secure cookies even while DEBUG=1
"""
import dj_database_url
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

_env_path = BASE_DIR / ".env"
if _env_path.is_file():
    for _line in _env_path.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if not _line or _line.startswith("#") or "=" not in _line:
            continue
        _key, _, _val = _line.partition("=")
        _key = _key.strip()
        _val = _val.strip().strip('"').strip("'")
        if _key and _key not in os.environ:
            os.environ[_key] = _val


def _env_bool(key: str, default: bool = False) -> bool:
    v = os.environ.get(key, "")
    if v == "":
        return default
    return v.lower() in ("1", "true", "yes", "on")


def _env_list(key: str, default_csv: str) -> list[str]:
    raw = os.environ.get(key, default_csv)
    return [x.strip() for x in raw.split(",") if x.strip()]


SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-(pc6butc=h7*6vm^8o^ci2bs)#b(!#n&#qdk9o%a3rar8v1sf(",
)

DEBUG = _env_bool("DJANGO_DEBUG", True)

ALLOWED_HOSTS = _env_list("*")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "accounts",
    "products",
    "orders",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

from datetime import timedelta

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "accounts.authentication.CookieJWTAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": True,
}

_default_frontend = (
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:5174,http://127.0.0.1:5174"
)
CORS_ALLOWED_ORIGINS = _env_list("DJANGO_CORS_ALLOWED_ORIGINS", _default_frontend)
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = _env_list("DJANGO_CSRF_TRUSTED_ORIGINS", _default_frontend)

if _env_bool("DJANGO_BEHIND_PROXY", False):
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SESSION_COOKIE_SECURE = (not DEBUG) or _env_bool("DJANGO_SECURE_COOKIES", False)
CSRF_COOKIE_SECURE = SESSION_COOKIE_SECURE

_cookie_samesite = os.environ.get("DJANGO_COOKIE_SAMESITE", "Lax")
if _cookie_samesite not in ("Lax", "Strict", "None"):
    _cookie_samesite = "Lax"
SESSION_COOKIE_SAMESITE = _cookie_samesite
CSRF_COOKIE_SAMESITE = _cookie_samesite

if _cookie_samesite == "None" and not SESSION_COOKIE_SECURE:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

JWT_AUTH_COOKIE_SECURE = SESSION_COOKIE_SECURE
JWT_AUTH_COOKIE_SAMESITE = _cookie_samesite

if not DEBUG:
    SECURE_SSL_REDIRECT = _env_bool("DJANGO_SECURE_SSL_REDIRECT", False)
    SESSION_COOKIE_HTTPONLY = True
else:
    SECURE_SSL_REDIRECT = False
