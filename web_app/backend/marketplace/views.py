from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from rest_framework import generics, status, mixins
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView
import hashlib
import base64
from .models import UserProfile, Listing, Order, Dispute, MockSmartContract, UploadedFile
from .serializers import (
    UserProfileSerializer, ListingSerializer, CreateListingSerializer,
    OrderSerializer, CreateOrderSerializer, DisputeSerializer,
    TelegramAuthSerializer, DepositSerializer, UploadFileSerializer,
    PrivyAuthLinkSerializer, WalletAuthSerializer,
    CreateListingTransactionSerializer, ConfirmTransactionSerializer,
    BlockchainListingSerializer, ApproveTokenTransactionSerializer,
    PurchaseListingTransactionSerializer, AcceptDeliveryTransactionSerializer,
    DisputeListingTransactionSerializer, DeliverListingTransactionSerializer,
    CreateOrderTransactionSerializer
)
from web3 import Web3
from .filters import ListingFilter
from eth_account.messages import encode_defunct
from .blockchain.transaction_builder import transaction_builder
from .blockchain.config import get_token_address


class WalletAuthView(generics.GenericAPIView, mixins.CreateModelMixin):
    """Authenticate user via MetaMask wallet signature"""
    serializer_class = WalletAuthSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        wallet_address = serializer.validated_data['wallet_address'].lower()
        signature = serializer.validated_data['signature']
        message = serializer.validated_data['message']

        try:
            # Verify the signature
            w3 = Web3()
            message_hash = encode_defunct(text=message)
            recovered_address = w3.eth.account.recover_message(message_hash, signature=signature)

            if recovered_address.lower() != wallet_address:
                return Response({
                    'success': False,
                    'detail': 'Invalid signature'
                }, status=status.HTTP_401_UNAUTHORIZED)

            # Get or create user with wallet address as username
            username = f"user_{wallet_address[:8]}"
            user, created = User.objects.get_or_create(
                username=wallet_address,  # Use full wallet address as unique username
                defaults={'first_name': username}
            )

            # Get or create profile
            profile, _ = UserProfile.objects.get_or_create(
                user=user,
                defaults={'wallet_address': wallet_address}
            )

            # Update wallet address if it changed (shouldn't happen but safety check)
            if profile.wallet_address != wallet_address:
                profile.wallet_address = wallet_address
                profile.save()

            return Response({
                'success': True,
                'user_id': user.id,
                'username': user.username,
                'wallet_address': profile.wallet_address,
                'created': created
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'success': False,
                'detail': f'Signature verification failed: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class TelegramAuthView(APIView):
    """Exchange Telegram login for JWT"""
    
    def post(self, request):
        serializer = TelegramAuthSerializer(data=request.data)
        if serializer.is_valid():
            telegram_id = serializer.validated_data['telegram_id']
            username = serializer.validated_data.get('username', f'user_{telegram_id}')
            
            # Get or create user
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'first_name': serializer.validated_data.get('first_name', '')}
            )
            
            # Get or create profile
            profile, _ = UserProfile.objects.get_or_create(
                user=user,
                defaults={'telegram_id': telegram_id}
            )
            
            return Response({
                'success': True,
                'user_id': user.id,
                'username': user.username,
                'telegram_id': profile.telegram_id
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PrivyAuthView(APIView):
    """Verify Privy ID token, upsert user, and link privy_user_id to telegram_id."""

    def post(self, request):
        # Expect Authorization: Bearer <idToken> and optional telegram_id in body
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return Response({'detail': 'Missing Bearer token'}, status=status.HTTP_401_UNAUTHORIZED)
        id_token = auth_header.split(' ', 1)[1].strip()

        # Verify JWT via Privy JWKS
        try:
            import requests
            from jose import jwt
        except Exception:
            return Response({'detail': 'Server missing JWT dependencies'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        PRIVY_ISS = "https://auth.privy.io"
        PRIVY_AUD = 'cmg42qhmu00voju0dwcn90l35'
        try:
            jwks = requests.get(f"{PRIVY_ISS}/.well-known/jwks.json", timeout=5).json()
            claims = jwt.decode(
                id_token,
                jwks,
                algorithms=['RS256', 'ES256'],
                audience=PRIVY_AUD,
                issuer=PRIVY_ISS,
                options={'verify_aud': True, 'verify_iss': True}
            )
        except Exception as e:
            return Response({'detail': f'Invalid token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)

        privy_user_id = claims.get('sub')
        email = claims.get('email')
        phone = claims.get('phone_number')

        serializer = PrivyAuthLinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=False)
        telegram_id = serializer.validated_data.get('telegram_id') if serializer.validated_data else None

        if telegram_id:
            user, _ = User.objects.get_or_create(
                username=f'user_{telegram_id}'
            )
            profile, _ = UserProfile.objects.get_or_create(
                user=user,
                defaults={'telegram_id': telegram_id}
            )
            if profile.telegram_id != telegram_id:
                profile.telegram_id = telegram_id
        else:
            base_username = email or phone or privy_user_id
            user, _ = User.objects.get_or_create(
                username=str(base_username)
            )
            profile, _ = UserProfile.objects.get_or_create(
                user=user,
                defaults={'telegram_id': 0}
            )

        profile.privy_user_id = privy_user_id
        profile.save()

        return Response({
            'success': True,
            'user_id': user.id,
            'privy_user_id': privy_user_id,
            'telegram_id': profile.telegram_id,
        }, status=status.HTTP_200_OK)


class ListingsView(generics.ListCreateAPIView):
    """List all listings or create new listing"""
    queryset = Listing.objects.filter(is_deleted=False, status__in=['open', 'filled', 'delivered', 'disputed'])
    serializer_class = ListingSerializer
    filterset_class = ListingFilter
    search_fields = ['title', 'description']
    ordering_fields = ['price', 'created_at', 'title']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateListingSerializer
        return ListingSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({'listings': serializer.data})


class ListingDetailView(generics.RetrieveAPIView):
    """Get single listing details"""
    queryset = Listing.objects.filter(is_deleted=False)
    serializer_class = ListingSerializer


class DeleteListingView(APIView):
    """Soft delete a listing (set is_deleted=True)"""
    
    def delete(self, request, listing_id):
        try:
            listing = get_object_or_404(Listing, id=listing_id, is_deleted=False)
            
            # Check if the user is the owner of the listing
            if request.data.get('seller_id') != listing.seller.id:
                return Response({
                    'error': 'You can only delete your own listings'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Soft delete the listing
            listing.is_deleted = True
            listing.save()
            
            return Response({
                'success': True,
                'message': 'Listing deleted successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class CreateOrderView(generics.CreateAPIView):
    """Create new order"""
    serializer_class = CreateOrderSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            order = serializer.save()
            
            # Mock escrow creation
            try:
                wallet_address = order.seller.userprofile.wallet_address if hasattr(order.seller, 'userprofile') else None
                escrow_success = MockSmartContract.create_escrow(
                    order.order_id, wallet_address, order.token_address, order.amount, order.deadline
                )
            except:
                escrow_success = True  # Mock always succeeds
            
            return Response({
                'order_id': order.order_id,
                'status': order.status,
                'amount': float(order.amount),
                'deadline': order.deadline.isoformat(),
                'escrow_created': escrow_success
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(generics.RetrieveAPIView):
    """Get order details"""
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    lookup_field = 'order_id'


class MockDepositView(APIView):
    """Mock deposit function"""
    
    def post(self, request, order_id):
        order = get_object_or_404(Order, order_id=order_id)
        serializer = DepositSerializer(data=request.data)
        
        if serializer.is_valid():
            # Check if order is in correct state
            if order.status not in ['created']:
                return Response({'error': 'Order cannot be paid in current status'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Mock deposit
            deposit_success = MockSmartContract.deposit(
                order_id, serializer.validated_data['buyer_address'], order.amount
            )
            
            if deposit_success:
                order.status = 'paid'
                order.escrow_tx_hash = '0x' + hashlib.sha256(f"deposit_{order_id}".encode()).hexdigest()
                order.save()
                
                return Response({
                    'success': True,
                    'status': order.status,
                    'tx_hash': order.escrow_tx_hash
                }, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Deposit failed'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConfirmDeliveryView(APIView):
    """Buyer confirms delivery"""
    
    def post(self, request, order_id):
        order = get_object_or_404(Order, order_id=order_id)
        
        # Check if order is in correct state
        if order.status not in ['paid', 'delivered']:
            return Response({'error': 'Order cannot be confirmed in current status'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Mock confirmation
        try:
            buyer_wallet = order.buyer.userprofile.wallet_address if hasattr(order.buyer, 'userprofile') else None
            confirm_success = MockSmartContract.confirm_delivery(order_id, buyer_wallet)
        except:
            confirm_success = True  # Mock always succeeds
        
        if confirm_success:
            order.status = 'confirmed'
            order.save()
            
            # Mock release funds
            MockSmartContract.release_funds(order_id)
            order.status = 'completed'
            order.save()
            
            return Response({
                'success': True,
                'status': order.status
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Confirmation failed'}, status=status.HTTP_400_BAD_REQUEST)


class UploadFileView(APIView):
    """Store image as base64 in database"""
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        serializer = UploadFileSerializer(data=request.data)
        
        if serializer.is_valid():
            file = serializer.validated_data['file']
            
            # Read and encode file content as base64
            file_content = file.read()
            base64_content = base64.b64encode(file_content).decode('utf-8')
            
            # Create data URL
            data_url = f"data:{file.content_type};base64,{base64_content}"
            
            return Response({
                'data_url': data_url,
                'url': data_url,  # For compatibility
                'filename': file.name,
                'size': len(file_content)
            }, status=status.HTTP_200_OK)
        

# ==================== BLOCKCHAIN TRANSACTION ENDPOINTS ====================

class CreateListingTransactionView(generics.GenericAPIView):
    """
    Build unsigned transaction for creating a listing on blockchain

    POST /api/listings/create-transaction/
    Request: CreateListingTransactionSerializer
    Response: transaction data + listing info
    """
    serializer_class = CreateListingTransactionSerializer

    def post(self, request, *args, **kwargs):

        # Validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Get seller user
        seller_wallet = data['seller_wallet']
        user = User.objects.filter(username=seller_wallet).first()
        if not user:
            return Response({
                'error': 'User not found. Please authenticate first.'
            }, status=status.HTTP_404_NOT_FOUND)

        # Generate unique listing ID
        listing_id = transaction_builder.generate_listing_id(
            seller_wallet,
            data['title']
        )

        # Calculate blockchain expiration timestamp
        blockchain_expiration = transaction_builder.calculate_expiration_timestamp(
            data['listing_duration_days']
        )

        # Get token address
        token_address = get_token_address(data['currency'])
        if not token_address:
            return Response({
                'error': f"Token {data['currency']} not supported"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create listing in database with pending status
        listing = Listing.objects.create(
            seller=user,
            title=data['title'],
            description=data['description'],
            price=data['price'],
            currency=data['currency'],
            token_address=token_address,
            image_url=data.get('image_url', ''),
            payment_method='escrow',
            escrow_type=data['escrow_type'],
            listing_duration_days=data['listing_duration_days'],
            status='inactive',  # Inactive until blockchain confirmation
            blockchain_listing_id=listing_id,
            blockchain_status='pending_tx',
            blockchain_expiration=blockchain_expiration
        )

        # Build unsigned transaction
        transaction = transaction_builder.build_create_listing_transaction(
            listing_id=listing_id,
            token_symbol=data['currency'],
            amount_in_tokens=float(data['price']),
            expiration_timestamp=blockchain_expiration,
            escrow_type=data['escrow_type'],
            from_address=seller_wallet
        )

        return Response({
            'success': True,
            'listing_id': listing_id,
            'db_listing_id': listing.id,
            'blockchain_expiration': blockchain_expiration,
            'transaction': transaction,
            'message': 'Transaction ready. Please sign with your wallet.'
        }, status=status.HTTP_200_OK)


class ConfirmListingTransactionView(generics.GenericAPIView):
    """
    Confirm that listing creation transaction was sent to blockchain

    POST /api/listings/{pk}/confirm-transaction/
    Request: ConfirmTransactionSerializer
    Response: confirmation status
    """
    serializer_class = ConfirmTransactionSerializer
    queryset = Listing.objects.all()

    def post(self, request, *args, **kwargs):
        # Get listing
        listing = self.get_object()

        # Validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tx_hash = serializer.validated_data['tx_hash']

        # Update listing with transaction hash
        listing.creation_tx_hash = tx_hash
        listing.blockchain_status = 'pending_confirmation'
        listing.save()

        return Response({
            'success': True,
            'message': 'Transaction submitted. Waiting for confirmation...',
            'tx_hash': tx_hash,
            'listing_id': listing.id
        }, status=status.HTTP_200_OK)


class FinalizeListingView(generics.GenericAPIView):
    """
    Finalize listing after blockchain confirmation

    POST /api/listings/{pk}/finalize/
    Request: none
    Response: finalized listing data
    """
    serializer_class = BlockchainListingSerializer
    queryset = Listing.objects.all()

    def post(self, request, *args, **kwargs):
        # Get listing
        listing = self.get_object()

        # TODO: Verify transaction was actually mined on blockchain
        # For now, we'll trust the frontend

        # Activate the listing
        listing.status = 'open'
        listing.blockchain_status = 'confirmed'
        listing.save()

        # Return serialized listing data
        serializer = self.get_serializer(listing)

        return Response({
            'success': True,
            'message': 'Listing successfully created on blockchain!',
            'listing': serializer.data
        }, status=status.HTTP_200_OK)


# ==================== BUYER TRANSACTION ENDPOINTS ====================

class ApproveTokenTransactionView(generics.GenericAPIView):
    """
    Build unsigned transaction for ERC20 token approval

    POST /api/orders/approve-token-transaction/
    Request: ApproveTokenTransactionSerializer
    Response: unsigned approve transaction
    """
    serializer_class = ApproveTokenTransactionSerializer

    def post(self, request, *args, **kwargs):
        # Validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Get listing
        try:
            listing = Listing.objects.get(id=data['listing_id'])
        except Listing.DoesNotExist:
            return Response({
                'error': 'Listing not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Build approval transaction
        try:
            transaction = transaction_builder.build_approve_token_transaction(
                token_symbol=listing.currency,
                amount_in_tokens=float(listing.price),
                from_address=data['buyer_wallet']
            )

            return Response({
                'success': True,
                'transaction': transaction,
                'token_symbol': listing.currency,
                'amount': float(listing.price),
                'message': 'Approve transaction ready. Please sign with your wallet.'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Failed to build transaction: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class PurchaseListingTransactionView(generics.GenericAPIView):
    """
    Build unsigned transaction for purchasing (fillListing)

    POST /api/orders/purchase-transaction/
    Request: PurchaseListingTransactionSerializer
    Response: unsigned fillListing transaction + order info
    """
    serializer_class = PurchaseListingTransactionSerializer

    def post(self, request, *args, **kwargs):
        # Validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Get listing
        try:
            listing = Listing.objects.get(id=data['listing_id'], status='open')
        except Listing.DoesNotExist:
            return Response({
                'error': 'Open listing not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Get buyer user
        buyer_wallet = data['buyer_wallet']
        buyer_user = User.objects.filter(username=buyer_wallet).first()
        if not buyer_user:
            return Response({
                'error': 'Buyer user not found. Please authenticate first.'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check buyer is not the seller
        if buyer_user == listing.seller:
            return Response({
                'error': 'Cannot purchase your own listing'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Calculate deadline timestamp
        deadline_timestamp = transaction_builder.calculate_deadline_timestamp(
            data['deadline_days']
        )

        # Create Order in database with pending status
        from datetime import datetime, timedelta
        order_id = '0x' + hashlib.sha256(
            f"{listing.blockchain_listing_id}_{buyer_wallet}_{datetime.now()}".encode()
        ).hexdigest()

        order = Order.objects.create(
            order_id=order_id,
            listing=listing,
            buyer=buyer_user,
            seller=listing.seller,
            amount=listing.price,
            token_address=listing.token_address,
            status='created',  # Will update to 'paid' after tx confirmation
            deadline=datetime.fromtimestamp(deadline_timestamp)
        )

        # Build fillListing transaction
        try:
            transaction = transaction_builder.build_fill_listing_transaction(
                listing_id=listing.blockchain_listing_id,
                deadline_timestamp=deadline_timestamp,
                from_address=buyer_wallet,
                extra_data=b''  # Empty for disputable listings
            )

            return Response({
                'success': True,
                'order_id': order.id,
                'blockchain_order_id': order_id,
                'deadline_timestamp': deadline_timestamp,
                'transaction': transaction,
                'message': 'Purchase transaction ready. Please sign with your wallet.'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # Delete the order if transaction building failed
            order.delete()
            return Response({
                'error': f'Failed to build transaction: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class ConfirmPurchaseView(generics.GenericAPIView):
    """
    Confirm purchase transaction was sent

    POST /api/orders/{pk}/confirm-purchase/
    Request: ConfirmTransactionSerializer
    Response: confirmation status
    """
    serializer_class = ConfirmTransactionSerializer
    queryset = Order.objects.all()

    def post(self, request, *args, **kwargs):
        from web3 import Web3
        from .blockchain.config import get_network_config, get_contract_address, ESCROW_ABI
        import time

        # Get order
        order = self.get_object()

        # Validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tx_hash = serializer.validated_data['tx_hash']

        # Connect to blockchain
        network_config = get_network_config()
        w3 = Web3(Web3.HTTPProvider(network_config['rpc_url']))

        try:
            # Wait for transaction receipt (with timeout)
            time.sleep(3)
            tx_receipt = w3.eth.get_transaction_receipt(tx_hash)

            # Check if transaction was successful
            if tx_receipt['status'] != 1:
                return Response({
                    'success': False,
                    'error': 'Transaction failed on blockchain'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Verify the transaction is for our contract
            escrow_address = get_contract_address('escrow')
            if tx_receipt['to'].lower() != escrow_address.lower():
                return Response({
                    'success': False,
                    'error': 'Transaction is not for the escrow contract'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Update order with transaction hash
            order.escrow_tx_hash = tx_hash
            order.status = 'paid'
            order.save()

            # Update listing status to filled
            order.listing.status = 'filled'
            order.listing.save()

            return Response({
                'success': True,
                'message': 'Purchase confirmed! Waiting for seller delivery...',
                'tx_hash': tx_hash,
                'order_id': order.id
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'success': False,
                'error': f'Failed to verify transaction: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


# ==================== SELLER TRANSACTION ENDPOINTS ====================

class DeliverListingTransactionView(generics.GenericAPIView):
    """
    Build unsigned transaction for delivery (deliverDisputableListing)

    POST /api/orders/{pk}/deliver-transaction/
    Request: DeliverListingTransactionSerializer
    Response: unsigned delivery transaction
    """
    serializer_class = DeliverListingTransactionSerializer
    queryset = Order.objects.all()

    def post(self, request, *args, **kwargs):
        # Get order
        order = self.get_object()

        # Validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Verify seller
        seller_wallet = data['seller_wallet']
        if order.seller.username != seller_wallet:
            return Response({
                'error': 'Only the seller can mark as delivered'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check order status
        if order.status != 'paid':
            return Response({
                'error': f'Cannot deliver order in status: {order.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Build delivery transaction
        try:
            transaction = transaction_builder.build_deliver_disputable_transaction(
                listing_id=order.listing.blockchain_listing_id,
                from_address=seller_wallet
            )

            return Response({
                'success': True,
                'transaction': transaction,
                'message': 'Delivery transaction ready. Please sign with your wallet.'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Failed to build transaction: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class ConfirmDeliveryTransactionView(generics.GenericAPIView):
    """
    Confirm delivery transaction was sent

    POST /api/orders/{pk}/confirm-delivery-transaction/
    Request: ConfirmTransactionSerializer
    Response: confirmation status
    """
    serializer_class = ConfirmTransactionSerializer
    queryset = Order.objects.all()

    def post(self, request, *args, **kwargs):
        # Get order
        order = self.get_object()

        # Validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tx_hash = serializer.validated_data['tx_hash']

        # Update order status
        order.status = 'delivered'
        order.save()

        # Update listing status
        order.listing.status = 'delivered'
        order.listing.save()

        return Response({
            'success': True,
            'message': 'Delivery confirmed! Waiting for buyer acceptance...',
            'tx_hash': tx_hash,
            'order_id': order.id
        }, status=status.HTTP_200_OK)


class DeliverListingTransactionByListingView(generics.GenericAPIView):
    """
    Build unsigned transaction for delivery by listing ID
    """
    serializer_class = DeliverListingTransactionSerializer
    queryset = Listing.objects.all()

    def post(self, request, *args, **kwargs):
        # Get listing
        listing = self.get_object()

        # Validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Verify seller
        seller_wallet = data['seller_wallet']
        if listing.seller.username != seller_wallet:
            return Response({
                'error': 'Only the seller can mark as delivered'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check listing status
        if listing.status != 'filled':
            return Response({
                'error': f'Cannot deliver listing in status: {listing.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Build delivery transaction
        try:
            transaction = transaction_builder.build_deliver_disputable_transaction(
                listing_id=listing.blockchain_listing_id,
                from_address=seller_wallet
            )

            return Response({
                'success': True,
                'transaction': transaction,
                'message': 'Delivery transaction ready. Please sign with your wallet.'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Failed to build transaction: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class ConfirmDeliveryTransactionByListingView(generics.GenericAPIView):
    """
    Confirm delivery transaction was sent by listing ID
    """
    serializer_class = ConfirmTransactionSerializer
    queryset = Listing.objects.all()

    def post(self, request, *args, **kwargs):
        from web3 import Web3
        from .blockchain.config import get_network_config, get_contract_address
        import time

        # Get listing
        listing = self.get_object()

        # Validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tx_hash = serializer.validated_data['tx_hash']

        # Connect to blockchain
        network_config = get_network_config()
        w3 = Web3(Web3.HTTPProvider(network_config['rpc_url']))

        try:
            # Wait for transaction receipt
            time.sleep(3)
            tx_receipt = w3.eth.get_transaction_receipt(tx_hash)

            # Check if transaction was successful
            if tx_receipt['status'] != 1:
                return Response({
                    'success': False,
                    'error': 'Transaction failed on blockchain'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Verify the transaction is for our contract
            escrow_address = get_contract_address('escrow')
            if tx_receipt['to'].lower() != escrow_address.lower():
                return Response({
                    'success': False,
                    'error': 'Transaction is not for the escrow contract'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Update listing status
            listing.status = 'delivered'
            listing.save()

            # Update order status if exists
            order = listing.orders.filter(status='paid').first()
            if order:
                order.status = 'delivered'
                order.save()

            return Response({
                'success': True,
                'message': 'Delivery confirmed! Waiting for buyer acceptance...',
                'tx_hash': tx_hash,
                'listing_id': listing.id
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'success': False,
                'error': f'Failed to verify transaction: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


# ==================== BUYER ACCEPTANCE/DISPUTE ENDPOINTS ====================

class AcceptDeliveryTransactionView(generics.GenericAPIView):
    """
    Build unsigned transaction for accepting delivery (resolveListing)

    POST /api/orders/{pk}/accept-transaction/
    Request: AcceptDeliveryTransactionSerializer
    Response: unsigned acceptance transaction
    """
    serializer_class = AcceptDeliveryTransactionSerializer
    queryset = Order.objects.all()

    def post(self, request, *args, **kwargs):
        # Get order
        order = self.get_object()

        # Validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Verify buyer
        buyer_wallet = data['buyer_wallet']
        if order.buyer.username != buyer_wallet:
            return Response({
                'error': 'Only the buyer can accept delivery'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check order status
        if order.status != 'delivered':
            return Response({
                'error': f'Cannot accept order in status: {order.status}. Must be delivered first.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Build resolve transaction (to_buyer=False means release to seller)
        try:
            transaction = transaction_builder.build_resolve_listing_transaction(
                listing_id=order.listing.blockchain_listing_id,
                to_buyer=False,  # Release funds to seller
                from_address=buyer_wallet
            )

            return Response({
                'success': True,
                'transaction': transaction,
                'message': 'Accept delivery transaction ready. Please sign with your wallet.'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Failed to build transaction: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class ConfirmAcceptanceView(generics.GenericAPIView):
    """
    Confirm acceptance transaction was sent

    POST /api/orders/{pk}/confirm-acceptance/
    Request: ConfirmTransactionSerializer
    Response: confirmation status
    """
    serializer_class = ConfirmTransactionSerializer
    queryset = Order.objects.all()

    def post(self, request, *args, **kwargs):
        # Get order
        order = self.get_object()

        # Validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tx_hash = serializer.validated_data['tx_hash']

        # Update order status to completed
        order.status = 'completed'
        order.save()

        return Response({
            'success': True,
            'message': 'Delivery accepted! Funds released to seller.',
            'tx_hash': tx_hash,
            'order_id': order.id
        }, status=status.HTTP_200_OK)


class DisputeListingTransactionView(generics.GenericAPIView):
    """
    Build unsigned transaction for disputing (disputeListing)

    POST /api/orders/{pk}/dispute-transaction/
    Request: DisputeListingTransactionSerializer
    Response: unsigned dispute transaction with entropy fee
    """
    serializer_class = DisputeListingTransactionSerializer
    queryset = Order.objects.all()

    def post(self, request, *args, **kwargs):
        # Get order
        order = self.get_object()

        # Validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Verify user is buyer or seller
        wallet_address = data['wallet_address']
        if wallet_address not in [order.buyer.username, order.seller.username]:
            return Response({
                'error': 'Only buyer or seller can dispute this order'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check order status
        if order.status not in ['delivered', 'paid']:
            return Response({
                'error': f'Cannot dispute order in status: {order.status}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get entropy fee from contract
        try:
            entropy_fee = transaction_builder.get_entropy_fee()
        except Exception as e:
            entropy_fee = int(0.001 * 10**18)  # Fallback: 0.001 ETH

        # Build dispute transaction
        try:
            transaction = transaction_builder.build_dispute_listing_transaction(
                listing_id=order.listing.blockchain_listing_id,
                entropy_fee_wei=entropy_fee,
                from_address=wallet_address
            )

            # Convert entropy fee to ETH for display
            entropy_fee_eth = entropy_fee / 10**18

            return Response({
                'success': True,
                'transaction': transaction,
                'entropy_fee_wei': entropy_fee,
                'entropy_fee_eth': entropy_fee_eth,
                'message': f'Dispute transaction ready. Entropy fee: {entropy_fee_eth} ETH. Please sign with your wallet.'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Failed to build transaction: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class ConfirmDisputeView(generics.GenericAPIView):
    """
    Confirm dispute transaction was sent

    POST /api/orders/{pk}/confirm-dispute/
    Request: ConfirmTransactionSerializer
    Response: confirmation status
    """
    serializer_class = ConfirmTransactionSerializer
    queryset = Order.objects.all()

    def post(self, request, *args, **kwargs):
        # Get order
        order = self.get_object()

        # Validate input data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tx_hash = serializer.validated_data['tx_hash']

        # Update order status to disputed
        order.status = 'disputed'
        order.save()

        # Create Dispute record
        # Determine initiator from request (should be passed in body)
        initiator_wallet = request.data.get('initiator_wallet')
        if initiator_wallet == order.buyer.username:
            initiator = order.buyer
        elif initiator_wallet == order.seller.username:
            initiator = order.seller
        else:
            initiator = order.buyer  # Default

        Dispute.objects.create(
            order=order,
            initiator=initiator,
            reason='Blockchain dispute initiated',
            status='open'
        )

        return Response({
            'success': True,
            'message': 'Dispute initiated! Awaiting arbiter decision...',
            'tx_hash': tx_hash,
            'order_id': order.id
        }, status=status.HTTP_200_OK)
