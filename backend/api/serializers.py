from rest_framework import serializers
from .models import *

class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = ['user_role_id', 'user_role_name']


class UserDataSerializer(serializers.ModelSerializer):
    user_role = UserRoleSerializer(read_only=True)
    user_role_id = serializers.PrimaryKeyRelatedField(
        queryset=UserRole.objects.all(), source='user_role', write_only=True
    )

    class Meta:
        model = UserData
        fields = [
            'user_data_id', 'user_name', 'user_email', 'user_contact',
            'user_address', 'user_password', 'user_role', 'user_role_id',
            'active', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'user_password': {'write_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }

    def create(self, validated_data):
        # Hash password before save
        password = validated_data.pop('user_password', None)
        user = super().create(validated_data)
        if password:
            user.user_password = password
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('user_password', None)
        instance = super().update(instance, validated_data)
        if password:
            instance.user_password = password
            instance.save()
        return instance


class ProductSerializer(serializers.ModelSerializer):
    created_by = UserDataSerializer(read_only=True)
    created_by_id = serializers.PrimaryKeyRelatedField(
        queryset=UserData.objects.all(), source='created_by', write_only=True
    )

    class Meta:
        model = Product
        fields = [
            'product_id', 'product_name', 'product_description', 'product_qty', 'created_at', 'created_by',
            'created_by_id', 'active'
        ]
        extra_kwargs = {
            'created_at': {'read_only': True},
        }


class ProductPriceSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = ProductPrice
        fields = [
            'product_price_id', 'product', 'product_id',
            'price', 'time_duration', 'active'
        ]


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = ['status_id', 'status_name']


class InvoiceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceType
        fields = ['invoice_type_id', 'invoice_type']


class PaymentSerializer(serializers.ModelSerializer):
    invoice_type = InvoiceTypeSerializer(read_only=True)
    invoice_type_id = serializers.PrimaryKeyRelatedField(
        queryset=InvoiceType.objects.all(), source='invoice_type', write_only=True
    )
    status = StatusSerializer(read_only=True)
    status_id = serializers.PrimaryKeyRelatedField(
        queryset=Status.objects.all(), source='status', write_only=True
    )

    class Meta:
        model = Payment
        fields = [
            'payment_id', 'invoice_type', 'invoice_type_id',
            'status', 'status_id', 'payment_percentage',
            'active', 'created_at'
        ]
        extra_kwargs = {
            'created_at': {'read_only': True},
        }


class OrderSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    user_data = UserDataSerializer(read_only=True)
    user_data_id = serializers.PrimaryKeyRelatedField(
        queryset=UserData.objects.all(), source='user_data', write_only=True
    )
    payment = PaymentSerializer(read_only=True)
    payment_id = serializers.PrimaryKeyRelatedField(
        queryset=Payment.objects.all(), source='payment', write_only=True
    )
    status = StatusSerializer(read_only=True)
    status_id = serializers.PrimaryKeyRelatedField(
        queryset=Status.objects.all(), source='status', write_only=True
    )

    class Meta:
        model = Order
        fields = [
            'order_id', 'product', 'product_id', 'user_data', 'user_data_id',
            'payment', 'payment_id', 'status', 'status_id',
            'timestamp_from', 'timestamp_to', 'created_at'
        ]
        extra_kwargs = {
            'created_at': {'read_only': True},
        }


class NotificationSerializer(serializers.ModelSerializer):
    user_data = UserDataSerializer(read_only=True)
    user_data_id = serializers.PrimaryKeyRelatedField(
        queryset=UserData.objects.all(), source='user_data', write_only=True
    )
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = Notification
        fields = [
            'notification_id', 'user_data', 'user_data_id', 'product', 'product_id',
            'notification_content', 'email_sent', 'is_read', 'deleted'
        ]


class UserAccessTokenSerializer(serializers.ModelSerializer):
    user_data = UserDataSerializer(read_only=True)
    user_data_id = serializers.PrimaryKeyRelatedField(
        queryset=UserData.objects.all(), source='user_data', write_only=True
    )

    class Meta:
        model = UserAccessToken
        fields = [
            'user_access_token_id', 'user_data', 'user_data_id',
            'user_access_token', 'user_access_token_expiry',
            'active', 'created_at'
        ]
        extra_kwargs = {
            'created_at': {'read_only': True},
        }
