from django.contrib import admin
from .models import Profile, Supplier, InventoryItem, Order, OrderItem, Changelog, InventoryItemChanges

# Customize Profile admin to show user, role, and bio in the list view
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'bio')

# Customize Supplier admin to display key supplier details
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'contact_email', 'phone', 'status', 'date_modified')

# Customize InventoryItem admin to show important inventory details
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'quantity', 'status', 'date_modified', 'date_added')

# Customize Order admin to display order information
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'supplier', 'status', 'total_amount', 'date_ordered')

# Customize OrderItem admin to display order item details
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'inventory_item', 'quantity', 'price')

admin.site.register(Profile, ProfileAdmin)
admin.site.register(Supplier, SupplierAdmin)
admin.site.register(InventoryItem, InventoryItemAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(OrderItem, OrderItemAdmin)
admin.site.register(Changelog)
admin.site.register(InventoryItemChanges)
