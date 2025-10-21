from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/wallet/', views.WalletAuthView.as_view(), name='wallet_auth'),
    path('auth/telegram/', views.TelegramAuthView.as_view(), name='telegram_auth'),
    path('auth/privy/', views.PrivyAuthView.as_view(), name='privy_auth'),
    
    # Listings
    path('listings/', views.ListingsView.as_view(), name='listings'),
    path('listings/<int:pk>/', views.ListingDetailView.as_view(), name='listing_detail'),
    path('listings/<int:listing_id>/delete/', views.DeleteListingView.as_view(), name='delete_listing'),

    # Blockchain Transaction Endpoints - Seller Creates Listing
    path('listings/create-transaction/', views.CreateListingTransactionView.as_view(), name='create_listing_transaction'),
    path('listings/<int:pk>/confirm-transaction/', views.ConfirmListingTransactionView.as_view(), name='confirm_listing_transaction'),
    path('listings/<int:pk>/finalize/', views.FinalizeListingView.as_view(), name='finalize_listing'),

    # Blockchain Transaction Endpoints - Buyer Purchases
    path('orders/approve-token-transaction/', views.ApproveTokenTransactionView.as_view(), name='approve_token_transaction'),
    path('orders/purchase-transaction/', views.PurchaseListingTransactionView.as_view(), name='purchase_listing_transaction'),
    path('orders/<int:pk>/confirm-purchase/', views.ConfirmPurchaseView.as_view(), name='confirm_purchase'),

    # Blockchain Transaction Endpoints - Seller Delivers
    path('orders/<int:pk>/deliver-transaction/', views.DeliverListingTransactionView.as_view(), name='deliver_listing_transaction'),
    path('orders/<int:pk>/confirm-delivery-transaction/', views.ConfirmDeliveryTransactionView.as_view(), name='confirm_delivery_transaction'),
    path('listings/<int:pk>/deliver-transaction/', views.DeliverListingTransactionByListingView.as_view(), name='deliver_listing_transaction_by_listing'),
    path('listings/<int:pk>/confirm-delivery-transaction/', views.ConfirmDeliveryTransactionByListingView.as_view(), name='confirm_delivery_transaction_by_listing'),

    # Blockchain Transaction Endpoints - Buyer Accepts/Disputes
    path('orders/<int:pk>/accept-transaction/', views.AcceptDeliveryTransactionView.as_view(), name='accept_delivery_transaction'),
    path('orders/<int:pk>/confirm-acceptance/', views.ConfirmAcceptanceView.as_view(), name='confirm_acceptance'),
    path('orders/<int:pk>/dispute-transaction/', views.DisputeListingTransactionView.as_view(), name='dispute_listing_transaction'),
    path('orders/<int:pk>/confirm-dispute/', views.ConfirmDisputeView.as_view(), name='confirm_dispute'),

    # Legacy/Mock Orders (keeping for backwards compatibility)
    path('orders/', views.CreateOrderView.as_view(), name='create_order'),
    path('orders/<str:order_id>/', views.OrderDetailView.as_view(), name='order_detail'),
    path('orders/<str:order_id>/deposit/', views.MockDepositView.as_view(), name='mock_deposit'),
    path('orders/<str:order_id>/confirm/', views.ConfirmDeliveryView.as_view(), name='confirm_delivery'),
    
    # File upload
    path('upload/', views.UploadFileView.as_view(), name='upload_file'),
]
