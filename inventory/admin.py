from django.contrib import admin
from .models import Product, Transaction, Supplier, Customer

admin.site.register(Product)
admin.site.register(Transaction)
admin.site.register(Supplier)
admin.site.register(Customer)
