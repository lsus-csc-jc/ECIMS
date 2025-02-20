from django.urls import path
from .views import login_page, signup_page, dashboard_view, orders_view, suppliers_view

urlpatterns = [
    path('', login_page, name='home'),  # This handles the root URL "/"
    path('login.html', login_page, name='login'),
    path('signup.html', signup_page, name='signup'),
    path('dashboard.html', dashboard_view, name='dashboard'),
    path('orders.html', orders_view, name='orders'),
    path('suppliers.html', suppliers_view, name='suppliers'),
]
