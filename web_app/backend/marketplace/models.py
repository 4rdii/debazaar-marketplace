from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from django.core.files.storage import default_storage
from django.utils import timezone
from datetime import timedelta




class CurrencyChoices(models.TextChoices):
    USDT = 'USDT', _('Tether USD')
    USDC = 'USDC', _('USD Coin')


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    telegram_id = models.BigIntegerField(unique=True)
    wallet_address = models.CharField(max_length=42, blank=True, null=True)
    privy_user_id = models.CharField(max_length=128, blank=True, null=True, db_index=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_ratings = models.IntegerField(default=0)
    dispute_count = models.IntegerField(default=0)
    total_orders = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    @property
    def dispute_rate(self):
        if self.total_orders == 0:
            return 0
        return (self.dispute_count / self.total_orders) * 100

    def __str__(self):
        return f"{self.user.username} (TG: {self.telegram_id})"


class Listing(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('sold', 'Sold'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('escrow', 'Using escrow'),
        ('direct', 'Direct'),
    ]
    
    
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='listings')
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=18, decimal_places=8, help_text="Price with up to 8 decimal places for precise crypto amounts")
    currency = models.CharField(max_length=10, choices=CurrencyChoices.choices, default=CurrencyChoices.USDT)
    token_address = models.CharField(max_length=42)
    file_path = models.CharField(max_length=500, blank=True, null=True)
    metadata_cid = models.CharField(max_length=100, blank=True, null=True)
    image_url = models.TextField(default='')
    image_cid = models.CharField(max_length=100, blank=True, null=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='escrow')
    listing_duration_days = models.IntegerField(default=30, help_text="Number of days the listing will be active")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_deleted = models.BooleanField(default=False, help_text="Soft delete flag")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_expired(self):
        """Check if the listing has expired based on listing_duration_days"""
        if not self.listing_duration_days:
            return False
        expiration_date = self.created_at + timedelta(days=self.listing_duration_days)
        return timezone.now() > expiration_date
    
    @property
    def expires_at(self):
        """Get the expiration date of the listing"""
        if not self.listing_duration_days:
            return None
        return self.created_at + timedelta(days=self.listing_duration_days)
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - ${self.price}"


class Order(models.Model):
    STATUS_CHOICES = [
        ('created', 'Created'),
        ('paid', 'Paid'),
        ('delivered', 'Delivered'),
        ('confirmed', 'Confirmed'),
        ('disputed', 'Disputed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    order_id = models.CharField(max_length=66, unique=True)  # bytes32 as hex
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='orders')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchases')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sales')
    amount = models.DecimalField(max_digits=18, decimal_places=8, help_text="Order amount with up to 8 decimal places")
    token_address = models.CharField(max_length=42)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    escrow_tx_hash = models.CharField(max_length=66, blank=True, null=True)
    delivery_cid = models.CharField(max_length=100, blank=True, null=True)
    deadline = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order {self.order_id[:8]}... - {self.listing.title}"


class Dispute(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    RESULT_CHOICES = [
        ('buyer_wins', 'Buyer Wins'),
        ('seller_wins', 'Seller Wins'),
        ('partial_refund', 'Partial Refund'),
        ('pending', 'Pending'),
    ]
    
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='dispute')
    initiator = models.ForeignKey(User, on_delete=models.CASCADE)
    reason = models.TextField()
    evidence_files = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, default='pending')
    arbitrator_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Dispute for Order {self.order.order_id[:8]}..."


# Mock Smart Contract Functions (placeholders)
class UploadedFile(models.Model):
    """Model for storing uploaded files with metadata"""
    file = models.FileField(upload_to='uploads/%Y/%m/%d/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    content_type = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.file.name} ({self.uploaded_at})"
    
    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size
            self.content_type = self.file.content_type
        super().save(*args, **kwargs)


class MockSmartContract:
    @staticmethod
    def create_escrow(order_id, seller_address, token_address, amount, deadline):
        """Mock function - returns True for MVP"""
        return True
    
    @staticmethod
    def deposit(order_id, buyer_address, amount):
        """Mock function - returns True for MVP"""
        return True
    
    @staticmethod
    def confirm_delivery(order_id, buyer_address):
        """Mock function - returns True for MVP"""
        return True
    
    @staticmethod
    def release_funds(order_id):
        """Mock function - returns True for MVP"""
        return True
    
    @staticmethod
    def open_dispute(order_id, evidence_uri):
        """Mock function - returns True for MVP"""
        return True
    
    @staticmethod
    def resolve_dispute(order_id, winner_address, seller_share):
        """Mock function - returns True for MVP"""
        return True