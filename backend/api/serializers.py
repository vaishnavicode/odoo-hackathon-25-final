from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password
from .models import (
    UserRole, UserData, Product, ProductPrice,
    Status, Order, Notification, InvoiceType, Payment, UserAccessToken
)


class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = ['user_role_id', 'user_role_name']


class UserDataSerializer(serializers.ModelSerializer):
    # New fields for registration
    confirm_password = serializers.CharField(write_only=True, required=True)
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
            'user_password', 'confirm_password', 'user_role', 'user_role_id',
            'active', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'user_password': {'write_only': True}
        }

    def validate(self, data):
        """Check password match"""
        if data['user_password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')  # remove confirm_password from saved data
        user_role = validated_data.pop('user_role')
        validated_data['user_password'] = make_password(validated_data['user_password'])  # hash password
        return UserData.objects.create(**validated_data, user_role=user_role)

    def update(self, instance, validated_data):
        validated_data.pop('confirm_password', None)
        user_role = validated_data.pop('user_role', None)
        if user_role:
            instance.user_role = user_role
        if 'user_password' in validated_data:
            validated_data['user_password'] = make_password(validated_data['user_password'])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class UserAccessTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccessToken
        fields = [
            'user_access_token_id',
            'user_data',
            'user_access_token',
            'user_access_token_expiry',
            'last_used_at',
            'created_at',
            'active'
        ]
        read_only_fields = ['user_access_token_id', 'created_at', 'last_used_at']

class LoginSerializer(serializers.Serializer):
    user_email = serializers.EmailField()
    user_password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            user = UserData.objects.get(user_email=data['user_email'])
        except UserData.DoesNotExist:
            raise serializers.ValidationError({"error": "Invalid credentials"})

        if not check_password(data['user_password'], user.user_password):
            raise serializers.ValidationError({"error": "Invalid credentials"})

        data['user'] = user
        return data
    
class ProductSerializer(serializers.ModelSerializer):
    created_by = UserDataSerializer(read_only=True)
    created_by_id = serializers.PrimaryKeyRelatedField(
        queryset=UserData.objects.all(), source='created_by', write_only=True
    )

    class Meta:
        model = Product
        fields = [
            'product_id', 'product_name', 'product_description', 'product_price', 
            'product_qty', 'created_by', 'created_by_id', 'active', 'created_at', 'updated_at'
        ]

class ProductPriceSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = ProductPrice
        fields = [
            'product_price_id', 'product', 'product_id', 'price', 
            'timestamp_duration', 'active'
        ]

class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = ['status_id', 'status_name']

class OrderSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    user_data = UserDataSerializer(read_only=True)
    user_data_id = serializers.PrimaryKeyRelatedField(
        queryset=UserData.objects.all(), source='user_data', write_only=True
    )
    status = StatusSerializer(read_only=True)
    status_id = serializers.PrimaryKeyRelatedField(
        queryset=Status.objects.all(), source='status', write_only=True
    )

    class Meta:
        model = Order
        fields = [
            'order_id', 'product', 'product_id', 'user_data', 'user_data_id', 
            'status', 'status_id', 'created_at', 'updated_at'
        ]

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
            'payment_id', 'invoice_type', 'invoice_type_id', 'status', 'status_id',
            'payment_percentage', 'active', 'created_at', 'updated_at'
        ]