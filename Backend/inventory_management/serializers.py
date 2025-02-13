from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Item, Supplier, Category, Order, OrderItem, Customer, Product

User = get_user_model()

# Serializer for user signup
class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)

    
    class Meta:
        model = User
        # Ensure that the User model fields include username. Here, we use email as username.
        fields = ('id', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        # Set username equal to email to satisfy the unique constraint.
        user = User(
            email=validated_data['email'],
            username=validated_data['first_name'],  # Assuming username is the first name
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

# Existing serializers for your models

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'  

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
