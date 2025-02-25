import os
from django.core.wsgi import get_wsgi_application

# Make sure the settings module name matches your project folder name (case-sensitive)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')

application = get_wsgi_application()
