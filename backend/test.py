#!/usr/bin/env python
"""
Test data generator for Rental Management System
This script creates sample data for testing purposes including:
- User roles (vendor, customer)
- User data (4 users: 2 vendors, 2 customers)
- Categories
- Products (10 products)
- Product prices
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rental_management.settings')
django.setup()

from api.models import UserRole, UserData, Category, Product, ProductPrice

def create_user_roles():
    """Create user roles: vendor and customer"""
    print("Creating user roles...")
    
    roles = [
        {'user_role_name': 'vendor'},
        {'user_role_name': 'customer'}
    ]
    
    created_roles = {}
    for role_data in roles:
        role, created = UserRole.objects.get_or_create(
            user_role_name=role_data['user_role_name']
        )
        if created:
            print(f"Created role: {role.user_role_name}")
        else:
            print(f"Role already exists: {role.user_role_name}")
        created_roles[role.user_role_name] = role
    
    return created_roles

def create_categories():
    """Create product categories"""
    print("\nCreating categories...")
    
    categories = [
        {'category_name': 'Electronics'},
        {'category_name': 'Sports Equipment'},
        {'category_name': 'Tools & Hardware'},
        {'category_name': 'Party & Events'},
        {'category_name': 'Outdoor & Camping'},
        {'category_name': 'Musical Instruments'},
        {'category_name': 'Photography'},
        {'category_name': 'Furniture'},
        {'category_name': 'Vehicles'},
        {'category_name': 'Books & Media'}
    ]
    
    created_categories = {}
    for cat_data in categories:
        category, created = Category.objects.get_or_create(
            category_name=cat_data['category_name']
        )
        if created:
            print(f"Created category: {category.category_name}")
        else:
            print(f"Category already exists: {category.category_name}")
        created_categories[category.category_name] = category
    
    return created_categories

def create_users(roles):
    """Create sample users: 2 vendors and 2 customers"""
    print("\nCreating users...")
    
    users = [
        # Vendors
        {
            'user_name': 'John Smith',
            'user_email': 'john.smith@techrental.com',
            'user_contact': '+1-555-0101',
            'user_address': '123 Tech Street, Silicon Valley, CA 94025',
            'user_password': 'vendor123',
            'user_role': roles['vendor']
        },
        {
            'user_name': 'Sarah Johnson',
            'user_email': 'sarah.johnson@outdoorgear.com',
            'user_contact': '+1-555-0102',
            'user_address': '456 Adventure Lane, Boulder, CO 80301',
            'user_password': 'vendor456',
            'user_role': roles['vendor']
        },
        # Customers
        {
            'user_name': 'Mike Wilson',
            'user_email': 'mike.wilson@email.com',
            'user_contact': '+1-555-0103',
            'user_address': '789 Student Ave, University Town, TX 78701',
            'user_password': 'customer123',
            'user_role': roles['customer']
        },
        {
            'user_name': 'Emily Davis',
            'user_email': 'emily.davis@email.com',
            'user_contact': '+1-555-0104',
            'user_address': '321 Professional Blvd, Business District, NY 10001',
            'user_password': 'customer456',
            'user_role': roles['customer']
        }
    ]
    
    created_users = {}
    for user_data in users:
        user, created = UserData.objects.get_or_create(
            user_email=user_data['user_email'],
            defaults=user_data
        )
        if created:
            print(f"Created user: {user.user_name} ({user.user_role.user_role_name})")
        else:
            print(f"User already exists: {user.user_name} ({user.user_role.user_role_name})")
        created_users[user.user_name] = user
    
    return created_users

def create_products(categories, users):
    """Create 10 sample products"""
    print("\nCreating products...")
    
    products = [
        {
            'product_name': 'MacBook Pro 16" (2023)',
            'product_description': 'Latest MacBook Pro with M2 Pro chip, 16GB RAM, 512GB SSD. Perfect for professional work, video editing, and development.',
            'product_qty': 5,
            'category': categories['Electronics'],
            'created_by': users['John Smith']
        },
        {
            'product_name': 'Canon EOS R5 Camera Kit',
            'product_description': 'Professional mirrorless camera with 45MP sensor, 8K video recording, and advanced autofocus system.',
            'product_qty': 3,
            'category': categories['Photography'],
            'created_by': users['John Smith']
        },
        {
            'product_name': 'Mountain Bike - Trek Fuel EX 8',
            'product_description': 'High-end mountain bike with full suspension, hydraulic disc brakes, and 29-inch wheels for trail riding.',
            'product_qty': 8,
            'category': categories['Sports Equipment'],
            'created_by': users['Sarah Johnson']
        },
        {
            'product_name': 'Camping Tent - 4 Person',
            'product_description': 'Spacious 4-person tent with weather-resistant material, easy setup, and multiple ventilation options.',
            'product_qty': 12,
            'category': categories['Outdoor & Camping'],
            'created_by': users['Sarah Johnson']
        },
        {
            'product_name': 'Professional Tool Set',
            'product_description': 'Complete tool set including wrenches, screwdrivers, pliers, and measuring tools in a durable case.',
            'product_qty': 15,
            'category': categories['Tools & Hardware'],
            'created_by': users['John Smith']
        },
        {
            'product_name': 'Electric Guitar - Fender Stratocaster',
            'product_description': 'Classic electric guitar with maple neck, alder body, and three single-coil pickups for versatile sound.',
            'product_qty': 4,
            'category': categories['Musical Instruments'],
            'created_by': users['John Smith']
        },
        {
            'product_name': 'Party Sound System',
            'product_description': 'Professional PA system with speakers, subwoofers, mixer, and microphones for events and parties.',
            'product_qty': 6,
            'category': categories['Party & Events'],
            'created_by': users['Sarah Johnson']
        },
        {
            'product_name': 'Office Chair - Ergonomic',
            'product_description': 'High-quality ergonomic office chair with adjustable height, lumbar support, and breathable mesh back.',
            'product_qty': 10,
            'category': categories['Furniture'],
            'created_by': users['John Smith']
        },
        {
            'product_name': 'Electric Scooter - Segway Ninebot',
            'product_description': 'Electric scooter with 15.5 mph max speed, 18.6-mile range, and LED lighting for urban commuting.',
            'product_qty': 7,
            'category': categories['Vehicles'],
            'created_by': users['Sarah Johnson']
        },
        {
            'product_name': 'Professional Photography Lighting Kit',
            'product_description': 'Complete lighting setup with softboxes, stands, reflectors, and continuous LED lights for studio photography.',
            'product_qty': 5,
            'category': categories['Photography'],
            'created_by': users['John Smith']
        }
    ]
    
    created_products = {}
    for product_data in products:
        product, created = Product.objects.get_or_create(
            product_name=product_data['product_name'],
            defaults=product_data
        )
        if created:
            print(f"Created product: {product.product_name} (Category: {product.category.category_name})")
        else:
            print(f"Product already exists: {product.product_name}")
        created_products[product.product_name] = product
    
    return created_products

def create_product_prices(products):
    """Create pricing for all products with different time durations"""
    print("\nCreating product prices...")
    
    # Define time durations and base prices
    time_durations = ['hour', 'day', 'week', 'month']
    
    for product_name, product in products.items():
        # Generate different base prices based on product type
        if 'MacBook' in product_name or 'Camera' in product_name:
            base_price = 50  # High-end electronics
        elif 'Bike' in product_name or 'Guitar' in product_name:
            base_price = 30  # Sports/Music equipment
        elif 'Tool' in product_name or 'Chair' in product_name:
            base_price = 15  # Tools/Furniture
        elif 'Tent' in product_name or 'Camping' in product_name:
            base_price = 25  # Outdoor equipment
        elif 'Sound System' in product_name or 'Lighting' in product_name:
            base_price = 40  # Professional equipment
        elif 'Scooter' in product_name:
            base_price = 20  # Transportation
        else:
            base_price = 25  # Default price
        
        for duration in time_durations:
            # Calculate price based on duration (longer = better value)
            if duration == 'hour':
                price = base_price
            elif duration == 'day':
                price = int(base_price * 0.8 * 8)  # 8 hours at 80% of hourly rate
            elif duration == 'week':
                price = int(base_price * 0.6 * 40)  # 40 hours at 60% of hourly rate
            elif duration == 'month':
                price = int(base_price * 0.4 * 160)  # 160 hours at 40% of hourly rate
            
            price_obj, created = ProductPrice.objects.get_or_create(
                product=product,
                time_duration=duration,
                defaults={'price': price}
            )
            
            if created:
                print(f"Created price: {product.product_name} - ${price}/{duration}")
            else:
                print(f"Price already exists: {product.product_name} - ${price}/{duration}")

def main():
    """Main function to create all test data"""
    print("Starting test data creation...")
    print("=" * 50)
    
    try:
        # Create user roles
        roles = create_user_roles()
        
        # Create categories
        categories = create_categories()
        
        # Create users
        users = create_users(roles)
        
        # Create products
        products = create_products(categories, users)
        
        # Create product prices
        create_product_prices(products)
        
        print("\n" + "=" * 50)
        print("Test data creation completed successfully!")
        print(f"Created {UserRole.objects.count()} user roles")
        print(f"Created {UserData.objects.count()} users")
        print(f"Created {Category.objects.count()} categories")
        print(f"Created {Product.objects.count()} products")
        print(f"Created {ProductPrice.objects.count()} product prices")
        
    except Exception as e:
        print(f"Error creating test data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
