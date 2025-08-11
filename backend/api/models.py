from django.db import models

class UserRole(models.Model):
    user_role_id = models.AutoField(primary_key=True)
    user_role_name = models.CharField(max_length=100)

    class Meta:
        db_table = 'user_role'

    def __str__(self):
        return self.user_role_name


class UserData(models.Model):
    user_data_id = models.AutoField(primary_key=True)
    user_name = models.CharField(max_length=100)
    user_email = models.EmailField(unique=True)
    user_contact = models.CharField(max_length=15)
    user_address = models.CharField(max_length=255) 
    user_password = models.CharField(max_length=255) 
    user_role = models.ForeignKey(UserRole, on_delete=models.PROTECT, related_name='users')
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_data'

    def __str__(self):
        return self.user_name


class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    product_name = models.CharField(max_length=200)
    product_description = models.TextField()
    product_price = models.IntegerField()
    product_qty = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(UserData, on_delete=models.CASCADE, related_name='products')
    active = models.BooleanField(default=True)

    class Meta:
        db_table = 'product'

    def __str__(self):
        return self.product_name


class ProductPrice(models.Model):
    product_price_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='prices')
    price = models.IntegerField()
    time_duration = models.CharField(max_length=100)
    active = models.BooleanField(default=True)

    class Meta:
        db_table = 'product_price'

    def __str__(self):
        return f"{self.product.product_name} - {self.price}"


class Status(models.Model):
    status_id = models.AutoField(primary_key=True)
    status_name = models.CharField(max_length=50)

    class Meta:
        db_table = 'status'

    def __str__(self):
        return self.status_name


class Order(models.Model):
    order_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='orders')
    user_data = models.ForeignKey(UserData, on_delete=models.PROTECT, related_name='orders')
    status = models.ForeignKey(Status, on_delete=models.PROTECT, related_name='orders')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'order'

    def __str__(self):
        return f"Order #{self.order_id} - {self.status.status_name}"


class Notification(models.Model):
    notification_id = models.AutoField(primary_key=True)
    user_data = models.ForeignKey(UserData, on_delete=models.CASCADE, related_name='notifications')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='notifications')
    notification_content = models.TextField()
    email_sent = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)

    class Meta:
        db_table = 'notification'

    def __str__(self):
        return f"Notification #{self.notification_id}"


class InvoiceType(models.Model):
    invoice_type_id = models.AutoField(primary_key=True)
    invoice_type = models.CharField(max_length=50)

    class Meta:
        db_table = 'invoice_type'

    def __str__(self):
        return self.invoice_type


class Payment(models.Model):
    payment_id = models.AutoField(primary_key=True)
    invoice_type = models.ForeignKey(InvoiceType, on_delete=models.PROTECT, related_name='payments')
    status = models.ForeignKey(Status, on_delete=models.PROTECT, related_name='payments')
    payment_percentage = models.IntegerField()
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payment'

    def __str__(self):
        return f"Payment #{self.payment_id} - {self.payment_percentage}%"


class UserAccessToken(models.Model):
    user_access_token_id = models.AutoField(primary_key=True)
    user_data = models.ForeignKey(UserData, on_delete=models.CASCADE, related_name='access_tokens')
    user_access_token = models.CharField(max_length=255)
    user_access_token_expiry = models.DateTimeField()
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_access_token'

    def __str__(self):
        return f"Token #{self.user_access_token_id} for user {self.user_data.user_name}"
