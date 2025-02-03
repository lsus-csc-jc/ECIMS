from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import viewsets
from .models import Product, Transaction, Supplier, Customer
from .serializer import ProductSerializer, TransactionSerializer, SupplierSerializer, CustomerSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]  # 🔹 Only logged-in users can access

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAdminUser]  # 🔹 Only Admins can access

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAdminUser]  # 🔹 Only Admins can modify suppliers

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]  # 🔹 All logged-in users can access
