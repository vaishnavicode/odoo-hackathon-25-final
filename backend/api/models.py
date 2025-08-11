from django.db import models
from django.contrib.auth.hashers import make_password

class UserRole(models.Model):
    user_role_id = models.BigAutoField(primary_key=True)
    user_role_name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'user_role'
        ordering = ['user_role_name']

    def __str__(self):
        return self.user_role_name


class UserData(models.Model):
    user_data_id = models.BigAutoField(primary_key=True)
    user_name = models.CharField(max_length=100)
    user_email = models.EmailField(unique=True, db_index=True)
    user_contact = models.CharField(max_length=15, blank=True, null=True, db_index=True)
    user_address = models.CharField(max_length=255, blank=True, null=True)
    user_password = models.CharField(max_length=255)
    user_role = models.ForeignKey(UserRole, on_delete=models.PROTECT, related_name='users')
    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.user_password and not self.user_password.startswith('pbkdf2_'):
            self.user_password = make_password(self.user_password)
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'user_data'
        ordering = ['user_name']

    def __str__(self):
        return self.user_name


class Category(models.Model):
    category_id = models.BigAutoField(primary_key=True)
    category_name = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'category'
        ordering = ['category_name']

    def __str__(self):
        return self.category_name


class Product(models.Model):
    product_id = models.BigAutoField(primary_key=True)
    product_name = models.CharField(max_length=200)
    product_description = models.TextField(blank=True, null=True)
    product_qty = models.PositiveIntegerField()
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_DEFAULT,  
        default=1, 
        related_name='products'
    )
    likes = models.PositiveIntegerField(default=0)  
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(UserData, on_delete=models.CASCADE, related_name='products')
    active = models.BooleanField(default=True)

    class Meta:
        db_table = 'product'
        ordering = ['product_name']

    def __str__(self):
        return self.product_name


class ProductPrice(models.Model):
    product_price_id = models.BigAutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='prices')
    price = models.PositiveIntegerField()
    time_duration = models.CharField(max_length=100)
    active = models.BooleanField(default=True)

    class Meta:
        db_table = 'product_price'
        ordering = ['-price']

    def __str__(self):
        return f"{self.product.product_name} - {self.price} / {self.time_duration}"


class Status(models.Model):
    status_id = models.BigAutoField(primary_key=True)
    status_name = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'status'
        ordering = ['status_name']

    def __str__(self):
        return self.status_name


class InvoiceType(models.Model):
    invoice_type_id = models.BigAutoField(primary_key=True)
    invoice_type = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'invoice_type'
        ordering = ['invoice_type']

    def __str__(self):
        return self.invoice_type


class Payment(models.Model):
    payment_id = models.BigAutoField(primary_key=True)
    invoice_type = models.ForeignKey(InvoiceType, on_delete=models.PROTECT, related_name='payments')
    status = models.ForeignKey(Status, on_delete=models.PROTECT, related_name='payments')
    payment_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payment'
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment #{self.payment_id} - {self.payment_percentage}%"


class Order(models.Model):
    order_id = models.BigAutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='orders')
    user_data = models.ForeignKey(UserData, on_delete=models.PROTECT, related_name='orders')
    payment = models.ForeignKey(Payment, on_delete=models.PROTECT, related_name='orders')
    status = models.ForeignKey(Status, on_delete=models.PROTECT, related_name='orders')
    timestamp_from = models.DateTimeField()
    timestamp_to = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'orders' 
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.order_id} ({self.status.status_name})"


class Notification(models.Model):
    notification_id = models.BigAutoField(primary_key=True)
    user_data = models.ForeignKey(UserData, on_delete=models.CASCADE, related_name='notifications')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='notifications')
    notification_content = models.TextField()
    email_sent = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)

    class Meta:
        db_table = 'notification'
        ordering = ['-notification_id']

    def __str__(self):
        return f"Notification #{self.notification_id} for {self.user_data.user_name}"


class UserAccessToken(models.Model):
    user_access_token_id = models.BigAutoField(primary_key=True)
    user_data = models.ForeignKey(UserData, on_delete=models.CASCADE, related_name='access_tokens')
    user_access_token = models.CharField(max_length=255, unique=True, db_index=True)
    user_access_token_expiry = models.DateTimeField()
    last_used_at = models.DateTimeField(blank=True, null=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_access_token'
        ordering = ['-created_at']

    def __str__(self):
        return f"Token #{self.user_access_token_id} for {self.user_data.user_name}"


class Delivery(models.Model):
    delivery_id = models.BigAutoField(primary_key=True)
    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='deliveries')
    delivery_address = models.CharField(max_length=255, blank=True, null=True)
    status = models.ForeignKey('Status', on_delete=models.CASCADE, related_name='deliveries')
    delivery_date = models.DateTimeField(blank=True, null=True)
    delivery_at = models.DateTimeField(null=True, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'delivery'
        ordering = ['-created_at']

    def __str__(self):
        return f"Delivery #{self.delivery_id} for Order #{self.order.order_id}"


class ProductLike(models.Model):
    user = models.ForeignKey(UserData, on_delete=models.CASCADE, related_name='liked_products')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_likes')  # changed here
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user} liked {self.product}"


class Wishlist(models.Model):
    wishlist_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(UserData, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'wishlist'
        unique_together = ('user', 'product')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.user.user_name} - {self.product.product_name}"
