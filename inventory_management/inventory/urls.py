from django.urls import path, include
from django.contrib import admin
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.routers import DefaultRouter
from .views import ItemViewSet, SupplierViewSet, CategoryViewSet, OrderViewSet, OrderItemViewSet, CustomerViewSet, ReportViewSet

router = DefaultRouter()
router.register(r'items', ItemViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'order_items', OrderItemViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'report', ReportViewSet)

urlpatterns = [
    path('v1/', include(router.urls)),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
]

