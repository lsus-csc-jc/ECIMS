from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet,
    ItemViewSet,
    SupplierViewSet,
    CategoryViewSet,
    OrderViewSet,
    OrderItemViewSet,
    CustomerViewSet
)

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'items', ItemViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'order_items', OrderItemViewSet)
router.register(r'customers', CustomerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
