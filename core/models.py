from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
#from django.contrib.auth.models import User
from django_currentuser.middleware import (get_current_user, get_current_authenticated_user)

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

    def save(self, *args, **kwargs):
        if self.pk is not None:
            original = Supplier.objects.get(pk=self.pk)
            fields = Supplier._meta.concrete_fields
            changedfields = []
            for field in fields:
                if getattr(original,field.name) != getattr(self,field.name):
                    Changelog.objects.create(
                        model_name="Supplier",
                        record_id=self.pk,
                        field_name=field.name,
                        old_value=getattr(original,field.name),
                        new_value=getattr(self,field.name),
                )
        super().save(*args, **kwargs)

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
    quantity = models.IntegerField(default=0)
    threshold = models.IntegerField(default=0)
    status = models.IntegerField(choices=INV_STATUS_CHOICES.items(), default=UNKNOWN)
    date_modified = models.DateTimeField(auto_now=True)
    date_added = models.DateTimeField(auto_now_add=True)
    alert_triggered = models.BooleanField(default=False)

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
        
    """ def save(self, *args, **kwargs):
        self.status = self.calculate_inv_status()
        if self.pk is not None:
            original = InventoryItem.objects.get(pk=self.pk)
            fields = InventoryItem._meta.concrete_fields
            changedfields = []
            for field in fields:
                if getattr(original,field.name) != getattr(self,field.name):
                    Changelog.objects.create(
                        model_name="InventoryItem",
                        record_id=self.pk,
                        field_name=field.name,
                        old_value=getattr(original,field.name),
                        new_value=getattr(self,field.name),
                )
        super().save(*args,**kwargs) """

    def save(self, *args, **kwargs):
        self.status = self.calculate_inv_status()
        if self.pk is not None:
            original = InventoryItem.objects.get(pk=self.pk)
            #fields = InventoryItem._meta.concrete_fields
            #changedfields = []
            if getattr(original,'quantity') != getattr(self,'quantity'):
                InventoryItemChanges.objects.create(
                    item=self,
                    old_value=getattr(original,'quantity'),
                    new_value=getattr(self,'quantity'),
                    status=getattr(self,'status'),
                )
        super().save(*args,**kwargs)

    def get_status_display(self):
        return self.INV_STATUS_CHOICES.get(self.status, "Unknown")

    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name

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
    # total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # Removed for now, needs recalculation logic if used
    # REMOVED Fields for single product/quantity:
    # product = models.CharField(max_length=255, blank=True, null=True)
    # quantity = models.PositiveIntegerField(blank=True, null=True)
    expected_delivery = models.DateField(blank=True, null=True)
    date_modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.order_number

# Model for items within an Order (Modified)
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items') # Changed related_name to 'items'
    product_name = models.CharField(max_length=255) # Changed from inventory_item ForeignKey
    quantity = models.PositiveIntegerField()
    # REMOVED price field for now
    # price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        # Updated __str__ representation
        return f"{self.quantity} x {self.product_name} in order {self.order.order_number}"

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

#Represents changelog
class Changelog(models.Model):
    model_name = models.CharField(max_length=100)
    record_id = models.IntegerField()
    field_name = models.CharField(max_length=100)
    old_value = models.CharField(max_length=255, null=True)
    new_value = models.CharField(max_length=255, null=True)
    executing_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, editable=False)
    date_executed = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.record_id}: {self.model_name} change {self.field_name} from {self.old_value} to {self.new_value}"

#Represents the inventory specific changelog
class InventoryItemChanges(models.Model):
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
    item = models.ForeignKey(InventoryItem, on_delete=models.PROTECT)
    old_value = models.CharField(max_length=255, null=True)
    new_value = models.CharField(max_length=255, null=True)
    status = models.PositiveSmallIntegerField(choices=INV_STATUS_CHOICES, default=UNKNOWN)
    executing_user = models.ForeignKey(User, on_delete=models.PROTECT, null=True, blank=True, editable=False)
    date_executed = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.item}: change quantity from {self.old_value} to {self.new_value}. status: {self.get_status_display()}"

    def save(self, *args, **kwargs):
        self.executing_user = get_current_user()
        super().save(*args,**kwargs)
    
    class Meta:
        ordering = ['-date_executed']

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