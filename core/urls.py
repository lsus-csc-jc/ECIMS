from django.urls import path
from .views import login_page, signup_page, dashboard_view, invmanagement_view, orders_view, suppliers_view, reports_view, settings_view, logout_view

urlpatterns = [
    path('', dashboard_view, name='home'),  # This handles the root URL "/"
    path('login.html', login_page, name='login'),
    path('signup.html', signup_page, name='signup'),
    path('dashboard.html', dashboard_view, name='dashboard'),
    path('invmanagement.html', invmanagement_view, name='invmanagement'),
    path('orders.html', orders_view, name='orders'),
    path('suppliers.html', suppliers_view, name='suppliers'),
    path('reports.html', reports_view, name='reports'),
    path('settings.html', settings_view, name='settings'),
    path('logout/', logout_view, name='logout'),
]
