from django.urls import path
from .views import login_page, signup_page, dashboard_view, orders_view, suppliers_view

urlpatterns = [
    path('', login_page, name='home'),  # This handles the root URL "/"
    path('login/', login_page, name='login'),
    path('signup/', signup_page, name='signup'),
    path('dashboard/', dashboard_view, name='dashboard'),
    path('orders/', orders_view, name='orders'),
    path('suppliers/', suppliers_view, name='suppliers'),
]
