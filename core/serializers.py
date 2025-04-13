# core/serializers.py
from rest_framework import serializers
from .models import Profile, InventoryItem, Supplier, Order, OrderItem, Report, Changelog, InventoryItemChanges
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)  # Nest user information

    class Meta:
        model = Profile
        fields = ['id', 'user', 'bio']

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'  

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = '__all__'

class ChangelogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Changelog
        fields = '__all__'

class InventoryItemChangesSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItemChanges
        fields = '__all__'
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['item_name'] = instance.item.name
        if instance.executing_user:
            if instance.executing_user.first_name and instance.executing_user.last_name:
                data['employee_name'] = instance.executing_user.first_name + " " + instance.executing_user.last_name
            else:
                data['employee_name'] = instance.executing_user.email
        else:
            data['employee_name'] = 'not available'
        return data