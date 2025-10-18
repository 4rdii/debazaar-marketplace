from django.contrib import admin
from .models import UserProfile, Listing, Order, Dispute


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'telegram_id', 'wallet_address', 'rating', 'dispute_rate']
    list_filter = ['created_at']
    search_fields = ['user__username', 'telegram_id', 'wallet_address']


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ['title', 'seller', 'price', 'currency', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['title', 'seller__username', 'description']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'listing', 'buyer', 'seller', 'amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['order_id', 'buyer__username', 'seller__username']


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ['order', 'initiator', 'status', 'result', 'created_at']
    list_filter = ['status', 'result', 'created_at']
    search_fields = ['order__order_id', 'initiator__username']