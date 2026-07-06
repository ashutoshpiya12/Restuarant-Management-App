from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    """A food category, e.g. Starters, Main Course, Desserts."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    """A single dish that belongs to a category."""
    category = models.ForeignKey(Category, related_name='items', on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image = models.ImageField(upload_to='menu_items/', blank=True, null=True)
    is_available = models.BooleanField(default=True)
    is_vegetarian = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category__name', 'name']

    def __str__(self):
        return f'{self.name} ({self.category.name})'


class UserProfile(models.Model):
    """Extra info about a user, used by the admin panel's Users screen."""
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('customer', 'Customer'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username} - {self.role}'


class Table(models.Model):
    """A physical table in the restaurant, used for dine-in orders."""
    number = models.PositiveIntegerField(unique=True)
    capacity = models.PositiveIntegerField(default=2)
    is_occupied = models.BooleanField(default=False)

    class Meta:
        ordering = ['number']

    def __str__(self):
        return f'Table {self.number}'


class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),        # just placed, not yet accepted by kitchen
        ('confirmed', 'Confirmed'),    # accepted by admin/kitchen
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('completed', 'Completed'),    # served AND paid — order closed out
        ('cancelled', 'Cancelled'),
    )
    PAYMENT_METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('digital', 'Digital'),  # QR / e-wallet, simulated in this demo
    )
    PAYMENT_STATUS_CHOICES = (
        ('unpaid', 'Unpaid'),      # not attempted yet
        ('pending', 'Pending'),    # cash promised, awaiting collection by staff
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    )

    customer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    guest_name = models.CharField(max_length=100, blank=True, help_text='Used when a customer orders without logging in')
    guest_phone = models.CharField(max_length=20, blank=True)
    table = models.ForeignKey(Table, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())

    def __str__(self):
        return f'Order #{self.id} - {self.status}'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=8, decimal_places=2, help_text='Price at time of order')

    @property
    def subtotal(self):
        return self.quantity * self.price

    def __str__(self):
        return f'{self.quantity} x {self.menu_item.name}'
