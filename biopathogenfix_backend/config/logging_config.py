LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,

    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },

    "handlers": {
        "console": {
            "class":     "logging.StreamHandler",
            "formatter": "simple",
        },
        "file_payments": {
            "class":     "logging.FileHandler",
            "filename":  "logs/payments.log",   # ← put logs in a folder
            "formatter": "verbose",
        },
        "file_errors": {
            "class":     "logging.FileHandler",
            "filename":  "logs/errors.log",     # ← all errors in one place
            "formatter": "verbose",
        },
    },

    "loggers": {
        # Payments app logs
        "payments": {
            "handlers":  ["console", "file_payments"],
            "level":     "INFO",
            "propagate": False,
        },
        # Catch all errors across the entire project
        "django": {
            "handlers":  ["console", "file_errors"],
            "level":     "ERROR",
            "propagate": False,
        },
    },
}