from django.shortcuts import render
from django.contrib.auth import authenticate, get_user_model
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.reverse import reverse
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Item, Supplier, Category, Order, OrderItem, Customer, Product
from .serializers import (
    ItemSerializer, SupplierSerializer, CategorySerializer, OrderSerializer,
    OrderItemSerializer, CustomerSerializer, ProductSerializer, UserSignupSerializer
)

User = get_user_model()

# ---------------------------
# Front-end page rendering views
# ---------------------------
def login_page(request):
    return render(request, 'login.html')

def dashboard_view(request):
    return render(request, 'dashboard.html')

def signup_view(request):
    return render(request, 'Signup.html')

def react_login_view(request):
    return render(request, 'login.html')

# ---------------------------
# API views
# ---------------------------

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def api_signup(request):
    """
    API endpoint for user signup.
    Expects JSON with: email, password, first_name, last_name.
    """
    print("Received signup data:", request.data)  # Debug: Check incoming data
    serializer = UserSignupSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"detail": "User created successfully."}, status=status.HTTP_201_CREATED)
    else:
        print("Signup errors:", serializer.errors)  # Debug: Print validation errors
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    """
    Log in using email and password.
    Assumes that a custom authentication backend is set up in settings.py
    to allow authentication with email.
    """
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Use the custom email backend to authenticate
    user = authenticate(request, email=email, password=password)
    
    if user is not None:
        if user.is_active:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        else:
            return Response({'detail': 'User account is not active.'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
def api_root(request, format=None):
    """
    Provides a simple API root that lists available endpoints.
    """
    return Response({
        'login': reverse('api-login', request=request, format=format),
        'signup': reverse('api-signup', request=request, format=format),
        'items': reverse('item-list', request=request, format=format),
        'suppliers': reverse('supplier-list', request=request, format=format),
        'categories': reverse('category-list', request=request, format=format),
        'orders': reverse('order-list', request=request, format=format),
        'order_items': reverse('order-item-list', request=request, format=format),
        'customers': reverse('customer-list', request=request, format=format),
        'products': reverse('product-list', request=request, format=format),
    })

# ---------------------------
# API viewsets
# ---------------------------
class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
