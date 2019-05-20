import os
import django
from celery import Celery
from celery.utils.log import get_task_logger


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hawc.settings.local')

# Setup django project
# Necessary for production, but make sure this is commented out in development. It causes endpoints not to save, for some reason.
# django.setup()

logger = get_task_logger(__name__)
app = Celery('hawc')

# Using a string here means the worker will not have to
# pickle the object when using Windows.
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    logger.info('Running the debug_task task.')
    print('Request: {0!r}'.format(self.request))
