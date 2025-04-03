from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()

# Profile for each user
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=50, default="Employee")
    bio = models.TextField(blank=True, null=True)

    # New optional fields for profile tab:
    phone = models.CharField(max_length=20, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    street = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=50, blank=True, null=True)
    state = models.CharField(max_length=50, blank=True, null=True)
    zip_code = models.CharField(max_length=10, blank=True, null=True)
    timezone = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.user.username


# Supplier model
class Supplier(models.Model):
    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=100, blank=True, null=True)
    contact_email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    status = models.BooleanField(default=True)
    date_modified = models.DateTimeField(auto_now=True)
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# Inventory item model
class InventoryItem(models.Model):
    INSTOCK = 3
    LOWSTOCK = 2
    OUTOFSTOCK = 1
    UNKNOWN = 0
    INV_STATUS_CHOICES = {
        INSTOCK: "In Stock",
        LOWSTOCK: "Low Stock",
        OUTOFSTOCK: "Out of Stock",
        UNKNOWN: "Unknown"
    }
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=0)
    threshold = models.PositiveIntegerField(default=0)
    #supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='inventory_items')
    status = models.PositiveSmallIntegerField(choices=INV_STATUS_CHOICES, default=UNKNOWN)
    date_modified = models.DateTimeField(auto_now=True)
    date_added = models.DateTimeField(auto_now_add=True)

    def calculate_inv_status(self):
        if self.threshold > 0:
            if self.quantity == 0:
                return self.OUTOFSTOCK
            if self.quantity <= self.threshold:
                return self.LOWSTOCK
            else:
                return self.INSTOCK
        else:
            return self.UNKNOWN
        
    def save(self, *args, **kwargs):
        self.status = self.calculate_inv_status()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']

# Order model
class Order(models.Model):
    ORDER_STATUS = (
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )
    order_number = models.CharField(max_length=100, unique=True)
    date_ordered = models.DateTimeField(auto_now_add=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='PENDING')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    # New fields added:
    product = models.CharField(max_length=255, blank=True, null=True)
    quantity = models.PositiveIntegerField(blank=True, null=True)
    expected_delivery = models.DateField(blank=True, null=True)
    date_modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.order_number

# Through model to represent items in an order
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_items')
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.inventory_item.name} in order {self.order.order_number}"

# Manage orders placed to suppliers
class PurchaseOrder(models.Model):
    order_number = models.CharField(max_length=50, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT)
    date = models.DateTimeField(auto_now_add=True)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    received = models.BooleanField(default=False)
    date_modified = models.DateTimeField(auto_now=True)
    # Does this data point need to be tracked twice?
    date_added = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Purchase Order #{self.id} to {self.supplier.name}"
    
# Items in a purchase order
class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name="order_items")
    item = models.ForeignKey(InventoryItem, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    date_modified = models.DateTimeField(auto_now=True)
    date_added = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.quantity} x {self.item.name} in PO #{self.purchase_order.id}"
    
# Represents reports
class Report(models.Model):
    name = models.CharField(max_length=100)
    query = models.CharField(max_length=100)
    modifying_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, editable=False)
    date_modified = models.DateTimeField(auto_now=True)
    date_added = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name}"


# -------------------------------
# Signals to automatically create and save a Profile when a User is created
# -------------------------------
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # Ensure that the profile exists before trying to save it
    if hasattr(instance, 'profile'):
        instance.profile.save()
