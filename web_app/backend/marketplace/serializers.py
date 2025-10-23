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


class OrderSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'order_id', 'status', 'created_at']


class ListingSerializer(serializers.ModelSerializer):
    seller = UserSerializer(read_only=True)
    seller_rating = serializers.SerializerMethodField()
    is_expired = serializers.ReadOnlyField()
    expires_at = serializers.ReadOnlyField()
    orders = OrderSimpleSerializer(many=True, read_only=True)
    buyer_address = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = ['id', 'seller', 'title', 'description', 'price', 'currency',
                 'token_address', 'file_path', 'metadata_cid', 'image_url',
                 'image_cid', 'payment_method', 'escrow_type', 'seller_contact',
                 'listing_duration_days',
                 'api_approval_method', 'tweet_username', 'crosschain_rpc_url',
                 'crosschain_nft_contract', 'crosschain_token_id',
                 'status', 'seller_rating', 'is_expired', 'expires_at', 'orders', 'buyer_address', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_seller_rating(self, obj):
        try:
            return float(obj.seller.userprofile.rating)
        except:
            return 0.0

    def get_buyer_address(self, obj):
        """Get buyer wallet address from the most recent order"""
        try:
            # Get the most recent order for this listing
            order = obj.orders.filter(status__in=['paid', 'delivered', 'confirmed']).first()
            if order and order.buyer:
                return order.buyer.username  # username is the wallet address
            return None
        except:
            return None


class CreateListingSerializer(serializers.ModelSerializer):
    seller_id = serializers.IntegerField(write_only=True)
    image_url = serializers.CharField(required=True, allow_blank=False)
    
    class Meta:
        model = Listing
        fields = ['seller_id', 'title', 'description', 'price', 'currency',
                 'token_address', 'file_path', 'metadata_cid', 'image_url',
                 'image_cid', 'payment_method', 'escrow_type', 'seller_contact',
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


class WalletAuthSerializer(serializers.Serializer):
    wallet_address = serializers.CharField(max_length=42)
    signature = serializers.CharField()
    message = serializers.CharField()


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


# ==================== BLOCKCHAIN TRANSACTION SERIALIZERS ====================

class CreateListingTransactionSerializer(serializers.Serializer):
    """Serializer for building createListing transaction"""
    seller_wallet = serializers.CharField(max_length=42, required=True)
    title = serializers.CharField(max_length=200, required=True)
    description = serializers.CharField(required=True)
    price = serializers.DecimalField(max_digits=18, decimal_places=8, required=True)
    currency = serializers.ChoiceField(choices=['PYUSD', 'USDC', 'USDT'], default='PYUSD')
    image_url = serializers.CharField(required=False, allow_blank=True, default='')
    escrow_type = serializers.ChoiceField(
        choices=['disputable', 'api_approval', 'onchain_approval'],
        default='disputable'
    )
    listing_duration_days = serializers.IntegerField(min_value=1, max_value=365, default=30)

    # API approval fields
    api_approval_method = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    tweet_username = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    crosschain_rpc_url = serializers.CharField(max_length=200, required=False, allow_blank=True, allow_null=True)
    crosschain_nft_contract = serializers.CharField(max_length=42, required=False, allow_blank=True, allow_null=True)
    crosschain_token_id = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)

    def validate_seller_wallet(self, value):
        """Validate wallet address format"""
        if not value.startswith('0x') or len(value) != 42:
            raise serializers.ValidationError('Invalid wallet address format')
        return value.lower()

    def validate_price(self, value):
        """Validate price is positive"""
        if value <= 0:
            raise serializers.ValidationError('Price must be greater than 0')
        return value


class ConfirmTransactionSerializer(serializers.Serializer):
    """Serializer for confirming transaction was sent"""
    tx_hash = serializers.CharField(max_length=66, required=True)

    def validate_tx_hash(self, value):
        """Validate transaction hash format"""
        if not value.startswith('0x') or len(value) != 66:
            raise serializers.ValidationError('Invalid transaction hash format')
        return value.lower()


class BlockchainListingSerializer(serializers.ModelSerializer):
    """Serializer for listing with blockchain data"""
    seller = UserSerializer(read_only=True)
    seller_rating = serializers.SerializerMethodField()
    is_expired = serializers.ReadOnlyField()
    expires_at = serializers.ReadOnlyField()

    class Meta:
        model = Listing
        fields = ['id', 'seller', 'title', 'description', 'price', 'currency',
                 'token_address', 'image_url', 'payment_method', 'escrow_type',
                 'listing_duration_days', 'status', 'seller_rating', 'is_expired',
                 'expires_at', 'blockchain_listing_id', 'blockchain_status',
                 'creation_tx_hash', 'blockchain_expiration', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'blockchain_listing_id',
                           'blockchain_status', 'creation_tx_hash', 'blockchain_expiration']

    def get_seller_rating(self, obj):
        try:
            return float(obj.seller.userprofile.rating)
        except:
            return 0.0


# ==================== BUYER TRANSACTION SERIALIZERS ====================

class ApproveTokenTransactionSerializer(serializers.Serializer):
    """Serializer for building ERC20 approve transaction"""
    buyer_wallet = serializers.CharField(max_length=42, required=True)
    listing_id = serializers.IntegerField(required=True)

    def validate_buyer_wallet(self, value):
        """Validate wallet address format"""
        if not value.startswith('0x') or len(value) != 42:
            raise serializers.ValidationError('Invalid wallet address format')
        return value.lower()


class PurchaseListingTransactionSerializer(serializers.Serializer):
    """Serializer for building fillListing transaction"""
    buyer_wallet = serializers.CharField(max_length=42, required=True)
    listing_id = serializers.IntegerField(required=True)
    deadline_days = serializers.IntegerField(min_value=1, max_value=365, default=7)
    tweet_id = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)

    def validate_buyer_wallet(self, value):
        """Validate wallet address format"""
        if not value.startswith('0x') or len(value) != 42:
            raise serializers.ValidationError('Invalid wallet address format')
        return value.lower()


class AcceptDeliveryTransactionSerializer(serializers.Serializer):
    """Serializer for building resolveListing (accept) transaction"""
    buyer_wallet = serializers.CharField(max_length=42, required=True)

    def validate_buyer_wallet(self, value):
        """Validate wallet address format"""
        if not value.startswith('0x') or len(value) != 42:
            raise serializers.ValidationError('Invalid wallet address format')
        return value.lower()


class DisputeListingTransactionSerializer(serializers.Serializer):
    """Serializer for building disputeListing transaction"""
    wallet_address = serializers.CharField(max_length=42, required=True)

    def validate_wallet_address(self, value):
        """Validate wallet address format"""
        if not value.startswith('0x') or len(value) != 42:
            raise serializers.ValidationError('Invalid wallet address format')
        return value.lower()


# ==================== SELLER TRANSACTION SERIALIZERS ====================

class DeliverListingTransactionSerializer(serializers.Serializer):
    """Serializer for building deliverDisputableListing transaction"""
    seller_wallet = serializers.CharField(max_length=42, required=True)

    def validate_seller_wallet(self, value):
        """Validate wallet address format"""
        if not value.startswith('0x') or len(value) != 42:
            raise serializers.ValidationError('Invalid wallet address format')
        return value.lower()


# ==================== ORDER MANAGEMENT SERIALIZERS ====================

class CreateOrderTransactionSerializer(serializers.Serializer):
    """Serializer for creating order in database after purchase"""
    listing_id = serializers.IntegerField(required=True)
    buyer_wallet = serializers.CharField(max_length=42, required=True)
    blockchain_listing_id = serializers.CharField(max_length=66, required=True)
    deadline_days = serializers.IntegerField(min_value=1, max_value=365, default=7)

    def validate_buyer_wallet(self, value):
        """Validate wallet address format"""
        if not value.startswith('0x') or len(value) != 42:
            raise serializers.ValidationError('Invalid wallet address format')
        return value.lower()

    def validate_blockchain_listing_id(self, value):
        """Validate listing ID format"""
        if not value.startswith('0x') or len(value) != 66:
            raise serializers.ValidationError('Invalid listing ID format')
        return value.lower()
