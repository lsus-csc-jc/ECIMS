from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.shortcuts import redirect
from inventory_management.views import login_page, dashboard_view, signup_view
from .views import api_login, api_root

def redirect_to_api(request):
    return redirect('/api/')

urlpatterns = [
    # Front-end page routes
    path('login/', login_page, name='login'),
    path('dashboard/', dashboard_view, name='dashboard'),
    path('signup/', signup_view, name='signup'),

    # Admin
    path('admin/', admin.site.urls),
    
    # API endpoints (defined in your app)
    path('api/', include('inventory_management.api_urls')),
    
    # JWT token endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # (Optional) Redirect the root URL to your API or login page
    path('', redirect_to_api),

    # New API routes
    path('', api_root, name='api_root'),  # Default route
]
