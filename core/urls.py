from django.urls import path
from .views import (
    login_page, signup_page, dashboard_view, invmanagement_view, orders_view, 
    save_order, suppliers_view, reports_view, settings_view, logout_view, 
    add_inventory_item, delete_inventory_item, add_user, profile_list, 
    reset_password, delete_user, edit_user, update_user, update_order, 
    get_suppliers, delete_order, 
    bulk_delete_orders, bulk_update_order_status,
    bulk_delete_inventory_items
)

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
    path('reset-password/', reset_password, name='reset_password'),
    path('delete_user/<int:user_id>/', delete_user, name='delete_user'),
    path('edit_user/<int:user_id>/', edit_user, name='edit_user'),
    path('update-user/<int:user_id>/', update_user, name='update_user'),
    path('update_order/<int:order_id>/', update_order, name='update_order'),
    path('get_suppliers/', get_suppliers, name='get_suppliers'),
    path('delete_order/<int:order_id>/', delete_order, name='delete_order'),
    path('orders/bulk_delete/', bulk_delete_orders, name='bulk_delete_orders'),
    path('orders/bulk_update_status/', bulk_update_order_status, name='bulk_update_order_status'),
    path('inventory/bulk_delete/', bulk_delete_inventory_items, name='bulk_delete_inventory_items'),
]