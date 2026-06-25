celery -A biopathproj worker --loglevel=info --pool=solo

celery -A biopathproj beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler

