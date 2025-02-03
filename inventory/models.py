from django.db import models
from django.contrib.auth.models import User  # Import User model for tracking employees

class Supplier(models.Model):
    name = models.CharField(max_length=255, unique=True)
    contact_email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Customer(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    sku = models.CharField(max_length=50, unique=True, default="TEMP-SKU")  # Unique product code
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=255)
    stock = models.IntegerField()
    low_stock_threshold = models.IntegerField(default=5)  # ✅ Alert when stock falls below this
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"

class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('purchase', 'Purchase'),
        ('sale', 'Sale'),
        ('return', 'Return'),
        ('adjustment', 'Stock Adjustment')
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('canceled', 'Canceled')
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)  # ✅ Customer details
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)  # ✅ Track supplier for purchases
    quantity = models.IntegerField()
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, default='purchase')
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')  # ✅ Track transaction status
    transaction_date = models.DateTimeField(auto_now_add=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)  # ✅ Track employee

    def __str__(self):
        return f"{self.transaction_type} - {self.quantity} x {self.product.name} on {self.transaction_date}"







