from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from marketplace.models import Listing

class Command(BaseCommand):
    help = 'Check delivered listings and enable dispute for seller after 1 hour'

    def handle(self, *args, **options):
        # Find listings in 'delivered' status for more than 10 seconds
        ten_seconds_ago = timezone.now() - timedelta(seconds=10)

        eligible_listings = Listing.objects.filter(
            status='delivered',
            delivered_at__isnull=False,
            delivered_at__lt=ten_seconds_ago
        )

        count = 0
        for listing in eligible_listings:
            # Allow seller to dispute by marking it as eligible
            # You can add a flag or just log it
            self.stdout.write(
                self.style.SUCCESS(
                    f'Listing {listing.id} eligible for seller dispute (delivered since {listing.updated_at})'
                )
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f'Found {count} listings eligible for seller dispute'))
