#!/usr/bin/env python
"""
Script to add 50 sample products to the marketplace database.
Run from backend directory: python add_sample_products.py
"""
import os
import django
import random
import base64
import requests
from io import BytesIO

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crypto_marketplace.settings')
django.setup()

from django.contrib.auth.models import User
from marketplace.models import UserProfile, Listing, CurrencyChoices

def get_placeholder_image(width=400, height=400, seed=None):
    """Generate a placeholder image using picsum.photos"""
    try:
        if seed is None:
            seed = random.randint(1, 1000)
        url = f"https://picsum.photos/seed/{seed}/{width}/{height}"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            # Convert to base64 data URL
            base64_content = base64.b64encode(response.content).decode('utf-8')
            return f"data:image/jpeg;base64,{base64_content}"
    except Exception as e:
        print(f"Error fetching image: {e}")

    # Return a simple colored placeholder if fetch fails
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzMzNjZjYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRpZ2l0YWwgUHJvZHVjdDwvdGV4dD48L3N2Zz4="

# Sample product data
PRODUCT_CATEGORIES = {
    "Software & Tools": [
        {"title": "Premium Code Editor License", "desc": "Professional code editor with AI assistance and advanced debugging features", "price": "49.99"},
        {"title": "Project Management Suite", "desc": "Complete project management tool with team collaboration features", "price": "89.99"},
        {"title": "Video Editing Software Pro", "desc": "Professional video editing software with 4K support and effects library", "price": "149.99"},
        {"title": "Design Tool Lifetime Access", "desc": "Vector graphics editor with unlimited cloud storage", "price": "199.99"},
        {"title": "Database Admin Tool", "desc": "Advanced database management and monitoring tool", "price": "79.99"},
        {"title": "API Testing Platform", "desc": "Complete API development and testing environment", "price": "69.99"},
        {"title": "Screen Recording Pro", "desc": "High-quality screen recording with editing capabilities", "price": "39.99"},
        {"title": "Password Manager Premium", "desc": "Secure password manager with family sharing", "price": "29.99"},
        {"title": "VPN Service - 1 Year", "desc": "Ultra-fast VPN with 100+ servers worldwide", "price": "59.99"},
        {"title": "Antivirus Suite", "desc": "Complete security suite with real-time protection", "price": "44.99"},
    ],
    "Digital Art & Graphics": [
        {"title": "HD Stock Photo Bundle", "desc": "1000+ high-resolution stock photos for commercial use", "price": "24.99"},
        {"title": "Vector Icon Pack", "desc": "5000+ customizable vector icons in multiple formats", "price": "19.99"},
        {"title": "Photoshop Actions Bundle", "desc": "200+ professional photo editing actions", "price": "14.99"},
        {"title": "3D Model Collection", "desc": "Premium 3D models for game development and animation", "price": "99.99"},
        {"title": "Texture Pack - 4K", "desc": "High-quality 4K textures for 3D rendering", "price": "34.99"},
        {"title": "Font Family Bundle", "desc": "Professional font collection with 50+ typefaces", "price": "49.99"},
        {"title": "Logo Template Pack", "desc": "100+ customizable logo templates", "price": "29.99"},
        {"title": "Illustration Bundle", "desc": "Hand-drawn illustrations for web and print", "price": "39.99"},
        {"title": "UI/UX Design Kit", "desc": "Complete design system with components and templates", "price": "79.99"},
        {"title": "Mockup Bundle", "desc": "Product mockup templates for presentations", "price": "24.99"},
    ],
    "Educational Content": [
        {"title": "Web Development Course", "desc": "Complete full-stack development bootcamp with projects", "price": "199.99"},
        {"title": "Machine Learning Masterclass", "desc": "Learn ML and AI with hands-on projects", "price": "149.99"},
        {"title": "Digital Marketing Course", "desc": "Comprehensive digital marketing strategy course", "price": "89.99"},
        {"title": "Photography Essentials", "desc": "Professional photography course from beginner to advanced", "price": "79.99"},
        {"title": "Business Strategy eBook", "desc": "Complete guide to modern business strategies", "price": "19.99"},
        {"title": "Language Learning Pack", "desc": "Interactive language learning course with audio", "price": "49.99"},
        {"title": "Music Production Course", "desc": "Learn to produce professional music tracks", "price": "129.99"},
        {"title": "Cryptocurrency Trading Guide", "desc": "Complete crypto trading strategy and analysis course", "price": "99.99"},
        {"title": "Graphic Design Fundamentals", "desc": "Master graphic design principles and tools", "price": "69.99"},
        {"title": "Fitness Training Program", "desc": "12-week comprehensive fitness and nutrition program", "price": "39.99"},
    ],
    "Templates & Themes": [
        {"title": "WordPress Theme Premium", "desc": "Responsive WordPress theme with page builder", "price": "59.99"},
        {"title": "React Dashboard Template", "desc": "Modern admin dashboard with React and TypeScript", "price": "49.99"},
        {"title": "Email Template Bundle", "desc": "50+ responsive email templates for marketing", "price": "29.99"},
        {"title": "Presentation Template Pack", "desc": "Professional PowerPoint templates for business", "price": "24.99"},
        {"title": "Resume/CV Templates", "desc": "Creative resume templates in multiple formats", "price": "14.99"},
        {"title": "Landing Page Bundle", "desc": "10 high-converting landing page templates", "price": "39.99"},
        {"title": "Social Media Templates", "desc": "Complete social media post template collection", "price": "19.99"},
        {"title": "Invoice Template Pack", "desc": "Professional invoice and receipt templates", "price": "9.99"},
        {"title": "Notion Template Bundle", "desc": "Productivity templates for Notion workspace", "price": "29.99"},
        {"title": "Shopify Theme", "desc": "Modern e-commerce theme with conversion optimization", "price": "79.99"},
    ],
    "Audio & Music": [
        {"title": "Royalty-Free Music Pack", "desc": "100+ background music tracks for content creation", "price": "49.99"},
        {"title": "Sound Effects Library", "desc": "1000+ high-quality sound effects for video and games", "price": "34.99"},
        {"title": "VST Plugin Bundle", "desc": "Professional audio plugins for music production", "price": "89.99"},
        {"title": "Meditation Music Collection", "desc": "Relaxing ambient music for meditation and wellness", "price": "19.99"},
        {"title": "Podcast Intro/Outro Pack", "desc": "Professional podcast intro and outro music tracks", "price": "24.99"},
        {"title": "Drum Sample Pack", "desc": "Premium drum samples for electronic music", "price": "29.99"},
        {"title": "Vocal Sample Library", "desc": "Professional vocal samples and acapellas", "price": "39.99"},
        {"title": "Cinematic Sound Pack", "desc": "Epic cinematic sounds for film and trailers", "price": "59.99"},
        {"title": "Lo-Fi Beat Collection", "desc": "Chill lo-fi beats for background music", "price": "19.99"},
        {"title": "Guitar Preset Pack", "desc": "Professional guitar amp and effects presets", "price": "24.99"},
    ]
    
}

def create_sample_products():
    """Create 50 sample products with images"""

    # Get or create a default seller
    user, created = User.objects.get_or_create(
        username='admin',
        defaults={'first_name': 'Admin', 'is_staff': True, 'is_superuser': True}
    )
    if created:
        user.set_password('admin123')
        user.save()
        print(f"Created admin user")

    # Create or update profile for admin
    try:
        profile = UserProfile.objects.get(user=user)
        print(f"Using existing admin profile")
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(
            user=user,
            wallet_address='0x0000000000000000000000000000000000000001'
        )
        print(f"Created profile for admin user")

    # Create additional sellers
    sellers = [user]
    for i in range(1, 6):
        # Generate proper 42-char wallet address (0x + 40 hex chars)
        # Pad with zeros on the left, seller number on the right
        wallet_address = f'0x{"0" * 35}{str(i + 1000).zfill(5)}'
        seller, created = User.objects.get_or_create(
            username=f'seller_{i}',
            defaults={'first_name': f'Seller {i}'}
        )
        if created:
            seller.set_password(f'seller{i}123')
            seller.save()

        # Create or update profile
        try:
            profile = UserProfile.objects.get(user=seller)
            print(f"Using existing seller: {seller.username}")
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(
                user=seller,
                wallet_address=wallet_address,
                rating=round(random.uniform(3.5, 5.0), 2),
                total_ratings=random.randint(10, 100),
                total_orders=random.randint(20, 200)
            )
            print(f"Created seller: {seller.username} with wallet {wallet_address}")

        sellers.append(seller)

    # Delete existing sample listings to avoid duplicates
    Listing.objects.filter(seller__in=sellers).delete()
    print("Cleared existing sample listings")

    count = 0
    token_addresses = [
        "0x637a1259c6afd7e3adf63993ca7e58bb438ab1b1",  # PYUSD (Arbitrum Sepolia)
    ]

    for category, products in PRODUCT_CATEGORIES.items():
        for product_data in products:
            try:
                # Get a random seller
                seller = random.choice(sellers)
                currency = CurrencyChoices.PYUSD

                # Get placeholder image
                print(f"Fetching image for: {product_data['title']}")
                image_url = get_placeholder_image(seed=count + 1)

                # Create listing
                listing = Listing.objects.create(
                    seller=seller,
                    title=product_data['title'],
                    description=product_data['desc'],
                    price=product_data['price'],
                    currency=currency,
                    token_address=token_addresses[0],
                    image_url=image_url,
                    payment_method=random.choice(['escrow', 'direct']),
                    listing_duration_days=random.choice([7, 14, 30, 60, 90]),
                    status='active'
                )

                count += 1
                print(f"Created product {count}: {listing.title} by {seller.username} - ${listing.price} {listing.currency}")

            except Exception as e:
                print(f"Error creating product: {e}")
                continue

    print(f"\n✅ Successfully created {count} sample products!")
    print(f"Total listings in database: {Listing.objects.count()}")

if __name__ == "__main__":
    print("Starting to create sample products...\n")
    create_sample_products()
