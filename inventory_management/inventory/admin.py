from django.contrib import admin
from .models import Item
from .models import Customer
from .models import Supplier
from .models import Category
from .models import Order
from .models import OrderItem
from .models import StockMovement
from .models import PurchaseOrder
from .models import PurchaseOrderItem


# Register your models here.

admin.site.register(Item)
admin.site.register(Customer)
admin.site.register(Supplier)
admin.site.register(Category)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(StockMovement)
admin.site.register(PurchaseOrder)
admin.site.register(PurchaseOrderItem)