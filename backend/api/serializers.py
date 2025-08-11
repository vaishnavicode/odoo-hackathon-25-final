from rest_framework import serializers
from .models import (
    UserRole, UserData, Product, ProductPrice,
    Status, Order, Notification, InvoiceType,
    Payment, UserAccessToken
)

# -------------------------
# User Role
# -------------------------
class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = '__all__'


# -------------------------
# User Data
# -------------------------
class UserDataSerializer(serializers.ModelSerializer):
    user_role = UserRoleSerializer(read_only=True)
    user_role_id = serializers.PrimaryKeyRelatedField(
        queryset=UserRole.objects.all(),
        source='user_role',
        write_only=True
    )

    class Meta:
        model = UserData
        fields = [
            'user_data_id', 'user_name', 'user_email', 'user_contact',
            'user_address', 'user_password', 'user_role', 'user_role_id',
            'active', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'user_password': {'write_only': True}
        }


# -------------------------
# Product
# -------------------------
class ProductSerializer(serializers.ModelSerializer):
    created_by = UserDataSerializer(read_only=True)
    created_by_id = serializers.PrimaryKeyRelatedField(
        queryset=UserData.objects.all(),
        source='created_by',
        write_only=True
    )

    class Meta:
        model = Product
        fields = '__all__'


# -------------------------
# Product Price
# -------------------------
class ProductPriceSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )

    class Meta:
        model = ProductPrice
        fields = '__all__'


# -------------------------
# Status
# -------------------------
class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = '__all__'


# -------------------------
# Order
# -------------------------
class OrderSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    user_data = UserDataSerializer(read_only=True)
    user_data_id = serializers.PrimaryKeyRelatedField(
        queryset=UserData.objects.all(),
        source='user_data',
        write_only=True
    )
    status = StatusSerializer(read_only=True)
    status_id = serializers.PrimaryKeyRelatedField(
        queryset=Status.objects.all(),
        source='status',
        write_only=True
    )

    class Meta:
        model = Order
        fields = '__all__'


# -------------------------
# Notification
# -------------------------
class NotificationSerializer(serializers.ModelSerializer):
    user_data = UserDataSerializer(read_only=True)
    user_data_id = serializers.PrimaryKeyRelatedField(
        queryset=UserData.objects.all(),
        source='user_data',
        write_only=True
    )
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )

    class Meta:
        model = Notification
        fields = '__all__'


# -------------------------
# Invoice Type
# -------------------------
class InvoiceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceType
        fields = '__all__'


# -------------------------
# Payment
# -------------------------
class PaymentSerializer(serializers.ModelSerializer):
    invoice_type = InvoiceTypeSerializer(read_only=True)
    invoice_type_id = serializers.PrimaryKeyRelatedField(
        queryset=InvoiceType.objects.all(),
        source='invoice_type',
        write_only=True
    )
    status = StatusSerializer(read_only=True)
    status_id = serializers.PrimaryKeyRelatedField(
        queryset=Status.objects.all(),
        source='status',
        write_only=True
    )

    class Meta:
        model = Payment
        fields = '__all__'


# -------------------------
# User Access Token
# -------------------------
class UserAccessTokenSerializer(serializers.ModelSerializer):
    user_data = UserDataSerializer(read_only=True)
    user_data_id = serializers.PrimaryKeyRelatedField(
        queryset=UserData.objects.all(),
        source='user_data',
        write_only=True
    )

    class Meta:
        model = UserAccessToken
        fields = '__all__'
