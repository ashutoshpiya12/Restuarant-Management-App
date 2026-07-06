from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Category, MenuItem, UserProfile, Table, Order
from .serializers import (
    CategorySerializer, MenuItemSerializer, UserSerializer,
    TableSerializer, OrderSerializer, RegisterSerializer,
)


class IsAdminOrReadOnly(permissions.BasePermission):
    """Anyone can view the public menu, only staff can create/edit/delete."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Login endpoint. Returns access/refresh tokens plus basic user info,
    so the React admin panel knows whether to show the admin dashboard."""

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        username = request.data.get('username')
        user = User.objects.filter(username=username).first()
        if user:
            response.data['user'] = {
                'id': user.id,
                'username': user.username,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
            }
        return response


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_admin(request):
    """Step 2.1 — Admin Registration. Creates a staff account."""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'detail': 'Account creation successful'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.select_related('category').all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)
        available = self.request.query_params.get('available')
        if available is not None:
            qs = qs.filter(is_available=(available == 'true'))
        return qs


class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    permission_classes = [IsAdminOrReadOnly]


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.prefetch_related('items').all()
    serializer_class = OrderSerializer

    def get_permissions(self):
        # Placing an order (from the public menu) or tracking one doesn't
        # require an account. Everything else needs a logged-in (staff) user.
        if self.action in ('create', 'track'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        # Non-staff users only ever see their own orders.
        if not self.request.user.is_authenticated:
            return qs.none()
        if not self.request.user.is_staff:
            qs = qs.filter(customer=self.request.user)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(customer=self.request.user)
        else:
            serializer.save()

    @action(detail=False, methods=['get'], url_path='track')
    def track(self, request):
        """Step 3.4 — Track Order. Looks an order up by id + the phone
        number given at checkout, so a guest can check status without
        an account, and without exposing every order to everyone."""
        order_id = request.query_params.get('order_id')
        phone = request.query_params.get('phone')
        if not order_id or not phone:
            return Response({'detail': 'order_id and phone are required.'}, status=status.HTTP_400_BAD_REQUEST)
        order = Order.objects.filter(id=order_id, guest_phone=phone).first()
        if not order:
            return Response({'detail': 'No matching order found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'], url_path='verify-payment', permission_classes=[permissions.IsAdminUser])
    def verify_payment(self, request, pk=None):
        """Step 4.3 — Verify Payment. Staff confirm a cash payment was collected."""
        order = self.get_object()
        received = request.data.get('received', True)
        order.payment_status = 'paid' if received else 'failed'
        order.save(update_fields=['payment_status', 'updated_at'])
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'], url_path='complete', permission_classes=[permissions.IsAdminUser])
    def complete(self, request, pk=None):
        """Step 4.4 — Complete Order. Only allowed once the order is ready and paid."""
        order = self.get_object()
        if order.status != 'ready':
            return Response({'detail': 'Order must be Ready before it can be completed.'}, status=status.HTTP_400_BAD_REQUEST)
        if order.payment_status != 'paid':
            return Response({'detail': 'Payment must be confirmed before completing the order.'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = 'completed'
        order.save(update_fields=['status', 'updated_at'])
        return Response(OrderSerializer(order).data)


class UserViewSet(viewsets.ModelViewSet):
    """Used by the admin panel's Users screen. Staff-only."""
    queryset = User.objects.select_related('profile').all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    """Returns the logged in user, used by the frontend to restore session state."""
    return Response(UserSerializer(request.user).data)


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def dashboard_stats(request):
    """Quick counts for the admin dashboard's summary cards."""
    today = timezone.now().date()
    todays_orders = Order.objects.filter(created_at__date=today)
    todays_sales = sum(o.total for o in todays_orders.filter(payment_status='paid'))
    return Response({
        'total_categories': Category.objects.count(),
        'total_menu_items': MenuItem.objects.count(),
        'total_users': User.objects.count(),
        'total_orders': Order.objects.count(),
        'pending_orders': Order.objects.filter(status='pending').count(),
        'todays_orders': todays_orders.count(),
        'todays_sales': todays_sales,
        'completed_orders': Order.objects.filter(status='completed').count(),
    })


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def daily_sales_report(request):
    """Step 4.5 — Reports: View daily sales. Groups paid orders by day."""
    from django.db.models import Count
    from django.db.models.functions import TruncDate

    rows = (
        Order.objects.filter(payment_status='paid')
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(order_count=Count('id'))
        .order_by('-day')[:30]
    )
    # total is a Python property (sums OrderItem subtotals), so it can't be
    # annotated in SQL — compute it per day from the matching orders instead.
    results = []
    for row in rows:
        day_orders = Order.objects.filter(payment_status='paid', created_at__date=row['day'])
        results.append({
            'day': row['day'],
            'order_count': row['order_count'],
            'total_sales': sum(o.total for o in day_orders),
        })
    return Response(results)
