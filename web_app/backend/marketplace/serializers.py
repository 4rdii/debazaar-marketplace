from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Listing, Order, Dispute, UploadedFile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name']


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['user', 'telegram_id', 'privy_user_id', 'wallet_address', 'rating', 'total_ratings', 
                 'dispute_count', 'total_orders', 'dispute_rate', 'created_at']


class ListingSerializer(serializers.ModelSerializer):
    seller = UserSerializer(read_only=True)
    seller_rating = serializers.SerializerMethodField()
    is_expired = serializers.ReadOnlyField()
    expires_at = serializers.ReadOnlyField()
    
    class Meta:
        model = Listing
        fields = ['id', 'seller', 'title', 'description', 'price', 'currency', 
                 'token_address', 'file_path', 'metadata_cid', 'image_url', 
                 'image_cid', 'payment_method',
                 'listing_duration_days',
                 'status', 'seller_rating', 'is_expired', 'expires_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_seller_rating(self, obj):
        try:
            return float(obj.seller.userprofile.rating)
        except:
            return 0.0


class CreateListingSerializer(serializers.ModelSerializer):
    seller_id = serializers.IntegerField(write_only=True)
    image_url = serializers.CharField(required=True, allow_blank=False)
    
    class Meta:
        model = Listing
        fields = ['seller_id', 'title', 'description', 'price', 'currency', 
                 'token_address', 'file_path', 'metadata_cid', 'image_url', 
                 'image_cid', 'payment_method',
                 'listing_duration_days', 'status']
    
    def create(self, validated_data):
        seller_id = validated_data.pop('seller_id')
        try:
            # Try to find user by telegram_id first, then by user id
            try:
                profile = UserProfile.objects.get(telegram_id=int(seller_id))
                seller = profile.user
            except UserProfile.DoesNotExist:
                seller = User.objects.get(id=int(seller_id))
        except (User.DoesNotExist, ValueError):
            raise serializers.ValidationError(f'User not found: {seller_id}')
        
        validated_data['seller'] = seller
        return super().create(validated_data)


class OrderSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only=True)
    buyer = UserSerializer(read_only=True)
    seller = UserSerializer(read_only=True)
    
    class Meta:
        model = Order
        fields = ['order_id', 'listing', 'buyer', 'seller', 'amount', 'token_address', 
                 'status', 'escrow_tx_hash', 'delivery_cid', 'deadline', 'created_at', 'updated_at']
        read_only_fields = ['order_id', 'created_at', 'updated_at']


class CreateOrderSerializer(serializers.ModelSerializer):
    listing_id = serializers.IntegerField(write_only=True)
    buyer_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Order
        fields = ['listing_id', 'buyer_id', 'amount', 'token_address']
    
    def create(self, validated_data):
        listing_id = validated_data.pop('listing_id')
        buyer_id = validated_data.pop('buyer_id')
        
        try:
            listing = Listing.objects.get(id=listing_id)
            buyer = User.objects.get(id=buyer_id)
        except (Listing.DoesNotExist, User.DoesNotExist):
            raise serializers.ValidationError('Listing or buyer not found')
        
        if buyer == listing.seller:
            raise serializers.ValidationError('Cannot buy your own listing')
        
        # Generate unique order ID
        import hashlib
        from datetime import datetime, timedelta
        
        order_id = '0x' + hashlib.sha256(f"{listing.id}_{buyer.id}_{datetime.now()}".encode()).hexdigest()
        deadline = datetime.now() + timedelta(days=7)
        
        validated_data.update({
            'order_id': order_id,
            'listing': listing,
            'buyer': buyer,
            'seller': listing.seller,
            'deadline': deadline
        })
        
        return super().create(validated_data)


class DisputeSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    initiator = UserSerializer(read_only=True)
    
    class Meta:
        model = Dispute
        fields = ['order', 'initiator', 'reason', 'evidence_files', 'status', 
                 'result', 'arbitrator_notes', 'created_at', 'resolved_at']
        read_only_fields = ['created_at', 'resolved_at']


class TelegramAuthSerializer(serializers.Serializer):
    telegram_id = serializers.IntegerField()
    username = serializers.CharField(required=False)
    first_name = serializers.CharField(required=False)


class PrivyAuthLinkSerializer(serializers.Serializer):
    telegram_id = serializers.IntegerField(required=False)


class DepositSerializer(serializers.Serializer):
    buyer_address = serializers.CharField(max_length=42)


class UploadFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedFile
        fields = ['file']
    