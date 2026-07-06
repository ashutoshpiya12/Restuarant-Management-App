from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'menu-items', views.MenuItemViewSet, basename='menuitem')
router.register(r'tables', views.TableViewSet, basename='table')
router.register(r'orders', views.OrderViewSet, basename='order')
router.register(r'users', views.UserViewSet, basename='user')

urlpatterns = [
    path('auth/register/', views.register_admin, name='register_admin'),
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', views.me, name='me'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
    path('reports/daily-sales/', views.daily_sales_report, name='daily_sales_report'),
    path('', include(router.urls)),
]
