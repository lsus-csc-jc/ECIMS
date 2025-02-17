from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Item, Supplier, Category, Order, OrderItem, Customer, Report
from .serializers import ItemSerializer, SupplierSerializer, CategorySerializer, OrderSerializer, OrderItemSerializer, CustomerSerializer, ReportSerializer

# Create your views here.

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['name','date_added']

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
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['first_name','last_name','date_added']

class ReportViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    queryset = Report.objects.all()
    serializer_class = ReportSerializer

    def perform_create(self, serializer):
        serializer.save(modifying_user=self.request.user)
        #return super().perform_create(serializer)
    
    def perform_update(self, serializer):
        serializer.save(modifying_user=self.request.user)
        #return super().perform_update(serializer)