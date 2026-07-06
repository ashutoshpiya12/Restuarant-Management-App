from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import Category, MenuItem, UserProfile, Table, Order, OrderItem


class CategorySerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'image', 'is_active', 'item_count', 'created_at']


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            'id', 'category', 'category_name', 'name', 'description', 'price',
            'image', 'is_available', 'is_vegetarian', 'created_at', 'updated_at',
        ]


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'phone', 'address']


class RegisterSerializer(serializers.ModelSerializer):
    """Creates a new admin/staff account (Step 2.1 — Admin Registration)."""
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ['username', 'password', 'email']

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('That username is already taken.')
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            is_staff=True,  # this signup flow is for restaurant admins/staff
        )
        UserProfile.objects.create(user=user, role='admin')
        return user


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'is_active', 'is_staff', 'date_joined', 'profile']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        instance = super().update(instance, validated_data)
        if profile_data:
            UserProfile.objects.update_or_create(user=instance, defaults=profile_data)
        return instance


class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ['id', 'number', 'capacity', 'is_occupied']


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_name', 'quantity', 'price', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    customer_name = serializers.CharField(source='customer.username', read_only=True, default=None)
    table_number = serializers.IntegerField(source='table.number', read_only=True, default=None)

    class Meta:
        model = Order
        fields = ['id', 'customer', 'customer_name', 'guest_name', 'guest_phone', 'table', 'table_number', 'status',
                  'payment_method', 'payment_status', 'items', 'total', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item in items_data:
            OrderItem.objects.create(order=order, **item)
        return order

    def update(self, instance, validated_data):
        # Items are set at creation time; updates here only touch simple
        # fields (status, table, customer) so changing an order's status
        # from the admin panel doesn't require resending its line items.
        validated_data.pop('items', None)
        return super().update(instance, validated_data)
