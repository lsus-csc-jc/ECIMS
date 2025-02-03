from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, TransactionViewSet, SupplierViewSet, CustomerViewSet

# Register API routes
router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'customers', CustomerViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
