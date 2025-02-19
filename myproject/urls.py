# myproject/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls_api')),  # API endpoints are now under /api/
    path('', include('core.urls')),            # your regular views
]
