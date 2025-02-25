from django.contrib import admin
from .models import Profile, Supplier, InventoryItem, Order, OrderItem

admin.site.register(Profile)
admin.site.register(Supplier)
admin.site.register(InventoryItem)
admin.site.register(Order)
admin.site.register(OrderItem)
