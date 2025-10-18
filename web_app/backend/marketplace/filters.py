import django_filters
from .models import Listing, CurrencyChoices


class ListingFilter(django_filters.FilterSet):
    
    # Price range filtering
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    
    # Currency filtering
    currency = django_filters.ChoiceFilter(choices=CurrencyChoices.choices)
    
    # Seller filtering
    seller = django_filters.NumberFilter(field_name='seller__id')
    seller_username = django_filters.CharFilter(field_name='seller__username', lookup_expr='icontains')
    
    # Date filtering
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = Listing
        fields = ['currency', 'status']
