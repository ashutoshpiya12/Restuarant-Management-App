from django.contrib import admin
from .models import Category, MenuItem, UserProfile, Table, Order, OrderItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    search_fields = ('name',)


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_available', 'is_vegetarian')
    list_filter = ('category', 'is_available', 'is_vegetarian')
    search_fields = ('name',)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'phone')
    list_filter = ('role',)


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('number', 'capacity', 'is_occupied')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'guest_name', 'table', 'status', 'payment_method', 'payment_status', 'created_at')
    list_filter = ('status', 'payment_status', 'payment_method')
    inlines = [OrderItemInline]
