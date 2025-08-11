from rest_framework import serializers
from .models import *
from django.contrib.auth.hashers import make_password

from datetime import timedelta
from django.utils.dateparse import parse_datetime
from .models import ProductPrice

def get_calculated_price(self, obj):
    start = obj.timestamp_from
    end = obj.timestamp_to
    if not start or not end or start >= end:
        total_days = 1
    else:
        total_days = (end - start).days or 1

    prices = obj.product.prices.all()
    
    day_price = prices.filter(time_duration__iexact='day').first()
    if day_price:
        return day_price.price * total_days * obj.quantity
    
    hour_price = prices.filter(time_duration__iexact='hour').first()
    if hour_price:
        hours = total_days * 24
        return hour_price.price * hours * obj.quantity
    
    week_price = prices.filter(time_duration__iexact='week').first()
    if week_price:
        weeks = total_days / 7
        return week_price.price * weeks * obj.quantity
    
    return 0


class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = '__all__'


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

    def create(self, validated_data):
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
        queryset=UserData.objects.all(),
        source='created_by',
        write_only=True
    )
    category = serializers.StringRelatedField(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        default=1
    )
    likes = serializers.IntegerField(default=0)

    class Meta:
        model = Product
        fields = [
            'product_id', 'product_name', 'product_description', 'product_qty', 'category', 'category_id',
            'likes', 'created_at', 'created_by', 'created_by_id', 'active'
        ]
        extra_kwargs = {
            'created_at': {'read_only': True}
        }


class ProductPriceSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
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
        queryset=Product.objects.all(),
        source='product',
        write_only=True
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
        queryset=Status.objects.all(),
        source='status',
        write_only=True
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


class DeliverySerializer(serializers.ModelSerializer):
    order_id = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.all(),
        source='order',
        write_only=True
    )
    status_id = serializers.PrimaryKeyRelatedField(
        queryset=Status.objects.all(),
        source='status',
        write_only=True
    )
    order = serializers.StringRelatedField(read_only=True)
    status = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Delivery
        fields = [
            'delivery_id', 'order', 'order_id',
            'delivery_address', 'status', 'status_id',
            'delivery_date', 'delivery_at', 'active', 'created_at'
        ]
        extra_kwargs = {
            'created_at': {'read_only': True},
        }


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['category_id', 'category_name']


class WishlistSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=UserData.objects.all(),
        source='user',
        write_only=True
    )
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    user = serializers.StringRelatedField(read_only=True)
    product = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Wishlist
        fields = ['wishlist_id', 'user', 'user_id', 'product', 'product_id', 'added_at']
        read_only_fields = ['wishlist_id', 'added_at']



class CartSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    calculated_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            'cart_id', 'product_id', 'product_name',
            'quantity', 'timestamp_from', 'timestamp_to',
            'calculated_price', 'added_at'
        ]

    def get_calculated_price(self, obj):
        start = obj.timestamp_from
        end = obj.timestamp_to
        quantity = obj.quantity or 1

        # Validate dates
        if not start or not end or start >= end:
            return 0

        delta = end - start
        total_hours = delta.total_seconds() / 3600

        prices = obj.product.prices.filter(active=True)
        if not prices.exists():
            return 0

        # Try to find the best matching price duration (in priority order)
        for duration in ['hour', 'day', 'week', 'month', 'year']:
            price_obj = prices.filter(time_duration__iexact=duration).first()
            if price_obj:
                price_per_unit = price_obj.price

                if duration == 'hour':
                    units = total_hours
                elif duration == 'day':
                    units = total_hours / 24
                elif duration == 'week':
                    units = total_hours / (24 * 7)
                elif duration == 'month':
                    units = total_hours / (24 * 30) 
                elif duration == 'year':
                    units = total_hours / (24 * 365) 
                else:
                    units = total_hours / 24  # default fallback

                total_price = price_per_unit * units * quantity
                return round(total_price, 2)

        # Fallback if no price found
        return 0
