# core/models.py

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

# Profile for each user
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True, null=True)
    # Add any other fields you have...

    def __str__(self):
        return self.user.username

# Supplier model
class Supplier(models.Model):
    name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return self.name

# Inventory item model
class InventoryItem(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=0)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='inventory_items')

    def __str__(self):
        return self.name

# Order model
class Order(models.Model):
    order_number = models.CharField(max_length=100, unique=True)
    date_ordered = models.DateTimeField(auto_now_add=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=50, default='Pending')
    # If needed, you can later add fields like total price, etc.

    def __str__(self):
        return self.order_number

# Through model to represent items in an order
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_items')
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.inventory_item.name} in order {self.order.order_number}"
