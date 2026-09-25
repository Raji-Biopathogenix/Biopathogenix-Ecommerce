"""Isolated test database; never connect tests to the configured business database."""
from .settings import *  # noqa: F403

DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': ':memory:'}}
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
GRAPH_ENABLED = False
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
