from django.urls import path
from .views import login_page, signup_page, dashboard_view, invmanagement_view, orders_view, save_order, suppliers_view, reports_view, settings_view, logout_view, add_inventory_item, delete_inventory_item, add_user, profile_list, reset_user_password, delete_user, edit_user, update_user, update_order 

urlpatterns = [
    path('', dashboard_view, name='home'),  # This handles the root URL "/"
    path('login.html', login_page, name='login'),
    path('signup.html', signup_page, name='signup'),
    path('dashboard.html', dashboard_view, name='dashboard'),
    path('invmanagement.html', invmanagement_view, name='invmanagement'),
    path('orders.html', orders_view, name='orders'),
    path('save_order/', save_order, name='save_order'),
    path('suppliers.html', suppliers_view, name='suppliers'),
    path('reports.html', reports_view, name='reports'),
    path('settings.html', settings_view, name='settings'),
    path('logout/', logout_view, name='logout'),
    path('inventory/add/', add_inventory_item, name='add_inventory_item'),
    path('inventory/delete/<int:item_id>/', delete_inventory_item, name='delete_inventory_item'),
    path('add_user/', add_user, name='add_user'),
    path('profiles/', profile_list, name='profile_list'),
    path('reset_user_password/<int:user_id>/', reset_user_password, name='reset_user_password'),
    path('delete_user/<int:user_id>/', delete_user, name='delete_user'),
    path('edit_user/<int:user_id>/', edit_user, name='edit_user'),
    path('update-user/<int:user_id>/', update_user, name='update_user'),
    path('update_order/<int:order_id>/', update_order, name='update_order'),
    

]