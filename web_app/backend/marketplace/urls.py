from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/telegram/', views.TelegramAuthView.as_view(), name='telegram_auth'),
    path('auth/privy/', views.PrivyAuthView.as_view(), name='privy_auth'),
    
    # Listings
    path('listings/', views.ListingsView.as_view(), name='listings'),
    path('listings/<int:pk>/', views.ListingDetailView.as_view(), name='listing_detail'),
    path('listings/<int:listing_id>/delete/', views.DeleteListingView.as_view(), name='delete_listing'),
    
    # Orders
    path('orders/', views.CreateOrderView.as_view(), name='create_order'),
    path('orders/<str:order_id>/', views.OrderDetailView.as_view(), name='order_detail'),
    path('orders/<str:order_id>/deposit/', views.MockDepositView.as_view(), name='mock_deposit'),
    path('orders/<str:order_id>/confirm/', views.ConfirmDeliveryView.as_view(), name='confirm_delivery'),
    
    # File upload
    path('upload/', views.UploadFileView.as_view(), name='upload_file'),
]
