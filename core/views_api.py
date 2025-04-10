# core/views_api.py
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from rest_framework import viewsets
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Profile, InventoryItem, Supplier, Order, OrderItem, Report, Changelog, InventoryItemChanges
from .serializers import ProfileSerializer, InventoryItemSerializer, SupplierSerializer, OrderSerializer, OrderItemSerializer, ReportSerializer, ChangelogSerializer, InventoryItemChangesSerializer
from django.db.models import F


def api_dashboard(request):
    data = {
        'totalProducts': InventoryItem.objects.count(),
        'totalAlerts': InventoryItem.objects.filter(status=InventoryItem.LOWSTOCK).count(),
        'pendingOrders': Order.objects.filter(status='PENDING').count(),
            'status': 200
    }
    return JsonResponse(data)

    #return HttpResponse("Hello world!")

class ProfileListCreateAPIView(generics.ListCreateAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [AllowAny]  # Allows access without authentication

class ProfileDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [AllowAny]  # Change this if you need to restrict access

class ItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['name','date_added','status']

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer

class ChangelogViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Changelog.objects.all()
    serializer_class = ChangelogSerializer

class InventoryItemChangesViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = InventoryItemChanges.objects.all()
    serializer_class = InventoryItemChangesSerializer

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