import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = os.getenv("ENV_FILE_PATH") or os.getenv("DOTENV_FILE_PATH")
load_dotenv(dotenv_path=ENV_FILE or (BASE_DIR / ".env"))


class Settings:
    # ── Email ──────────────────────────────────────────────────────────
    EMAIL_BACKEND         = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
    EMAIL_HOST            = os.getenv('EMAIL_HOST', 'smtp.office365.com')
    EMAIL_PORT            = int(os.getenv('EMAIL_PORT', 587))
    EMAIL_USE_TLS         = os.getenv('EMAIL_USE_TLS', 'True').lower() in ('1', 'true', 'yes')
    EMAIL_USE_SSL         = os.getenv('EMAIL_USE_SSL', 'False').lower() in ('1', 'true', 'yes')
    EMAIL_HOST_USER       = os.getenv('EMAIL_HOST_USER')        # ❌ no default
    EMAIL_HOST_PASSWORD   = os.getenv('EMAIL_HOST_PASSWORD')    # ❌ no default
    DEFAULT_FROM_EMAIL    = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)
    ERROR_RECIPIENT       = os.getenv('ERROR_RECIPIENT')        # ❌ no default
    ADMIN_ALERT_EMAIL     = os.getenv('ADMIN_ALERT_EMAIL')      # ❌ no default

    # ── OTP ────────────────────────────────────────────────────────────
    OTP_LENGTH            = int(os.getenv('OTP_LENGTH', 6))
    OTP_TTL_SECONDS       = int(os.getenv('OTP_TTL_SECONDS', 300))
    OTP_RATE_LIMIT_WINDOW = int(os.getenv('OTP_RATE_LIMIT_WINDOW', 300))
    OTP_RATE_LIMIT_MAX    = int(os.getenv('OTP_RATE_LIMIT_MAX', 5))

    # ── Redis ──────────────────────────────────────────────────────────
    REDIS_URL             = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/1')

    # ── QuickBooks ─────────────────────────────────────────────────────
    QB_CLIENT_ID          = os.getenv('QB_CLIENT_ID')           # ❌ no default
    QB_CLIENT_SECRET      = os.getenv('QB_CLIENT_SECRET')       # ❌ no default
    QB_ENVIRONMENT        = os.getenv('QB_ENVIRONMENT', 'sandbox')

    # ── Logging ────────────────────────────────────────────────────────
    LOG_LEVEL             = os.getenv('LOG_LEVEL', 'INFO')


configSettings = Settings()
