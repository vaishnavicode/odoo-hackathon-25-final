import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _



class UserRole(models.Model):
    user_role_id = models.AutoField(primary_key=True)
    user_role_name = models.CharField(max_length=100)

    def __str__(self):
        return self.user_role_name

class UserData(models.Model):
    user_data_id = models.AutoField(primary_key=True)
    user_name = models.CharField(max_length=100)
    user_email = models.EmailField(unique=True)
    user_contact = models.CharField(max_length=15)
    user_password = models.CharField(max_length=255)  # hashed password
    user_role = models.ForeignKey(UserRole, on_delete=models.CASCADE)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.user_name

class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    product_name = models.CharField(max_length=200)
    product_description = models.TextField()
    product_price = models.IntegerField()
    product_qty = models.IntegerField()
    created_by = models.ForeignKey(UserData, on_delete=models.CASCADE)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.product_name


class ProductPrice(models.Model):
    product_price_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    price = models.IntegerField()
    timestamp_duration = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.product.product_name} - {self.price}"


class Status(models.Model):
    status_id = models.AutoField(primary_key=True)
    status_name = models.CharField(max_length=50)

    def __str__(self):
        return self.status_name


class Order(models.Model):
    order_id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    user_data = models.ForeignKey(UserData, on_delete=models.CASCADE)
    status = models.ForeignKey(Status, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"Order #{self.order_id}"


class Notification(models.Model):
    notification_id = models.AutoField(primary_key=True)
    user_data = models.ForeignKey(UserData, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    notification_content = models.TextField()
    email_sent = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)


    def __str__(self):
        return f"Notification #{self.notification_id}"


class InvoiceType(models.Model):
    invoice_type_id = models.AutoField(primary_key=True)
    invoice_type = models.CharField(max_length=50)

    def __str__(self):
        return self.invoice_type


class Payment(models.Model):
    payment_id = models.AutoField(primary_key=True)
    invoice_type = models.ForeignKey(InvoiceType, on_delete=models.CASCADE)
    status = models.ForeignKey(Status, on_delete=models.CASCADE)
    payment_percentage = models.IntegerField()
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"Payment #{self.payment_id}"
