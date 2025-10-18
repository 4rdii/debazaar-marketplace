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
    PrivyAuthLinkSerializer
)
from .filters import ListingFilter


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
    queryset = Listing.objects.filter(status='active', is_deleted=False)
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
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
