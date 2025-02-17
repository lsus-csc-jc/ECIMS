from django.db import models
#from django.contrib.auth.models import User
from django.conf import settings

# Create your models here.

#Represents customers
class Customer(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    date_added = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"

#Represents individual inventory items
class Item(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    quantity = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    date_added = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name}"
    
    class Meta:
        ordering = ['name']

#Track where inventory is sourced from 
class Supplier(models.Model):
    name = models.CharField(max_length=100)
    contact_person = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    date_added = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
#Organize items into categories
class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    date_added = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
#Track orders for inventory
class Order(models.Model):
    ORDER_STATUS = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    order_number = models.CharField(max_length=50, unique=True)
    date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='PENDING')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    def __str__(self):
        return f"Order #{self.order_number}"
    
#Track items in each order
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="order_items")
    item = models.ForeignKey(Item, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.quantity} x {self.item.name} in Order #{self.order.order_number}"
    
#Track inventory changes (i.e., incoming stock, outgoing sales, etc.)
class StockMovement(models.Model):
    MOVEMENT_TYPE = [
        ('IN', 'Stock In'),
        ('OUT', 'Stock Out'),
    ]
    
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    movement_type = models.CharField(max_length=3, choices=MOVEMENT_TYPE)
    quantity = models.IntegerField()
    date = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.movement_type} - {self.quantity} {self.item.name} on {self.date}"

#Manage orders placed to suppliers
class PurchaseOrder(models.Model):
    order_number = models.CharField(max_length=50, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT)
    date = models.DateTimeField(auto_now_add=True)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    received = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Purchase Order #{self.id} to {self.supplier.name}"
    
#Items in a purchase order
class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name="order_items")
    item = models.ForeignKey(Item, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.quantity} x {self.item.name} in PO #{self.purchase_order.id}"

#Represents reports
class Report(models.Model):
    name = models.CharField(max_length=100)
    query = models.CharField(max_length=100)
    modifying_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, editable=False)
    date_added = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name}"