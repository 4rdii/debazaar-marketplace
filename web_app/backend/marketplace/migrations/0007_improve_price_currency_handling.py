# Generated manually for improved price and currency handling

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0006_update_digital_categories'),
    ]

    operations = [
        # Update price field to support more decimal places for crypto
        migrations.AlterField(
            model_name='listing',
            name='price',
            field=models.DecimalField(
                decimal_places=8,
                help_text='Price with up to 8 decimal places for precise crypto amounts',
                max_digits=18
            ),
        ),
        
        # Update currency field to use choices
        migrations.AlterField(
            model_name='listing',
            name='currency',
            field=models.CharField(
                choices=[
                    ('USDT', 'Tether USD'),
                    ('USDC', 'USD Coin'),
                    ('BTC', 'Bitcoin'),
                ],
                default='USDT',
                max_length=10
            ),
        ),
        
        # Update order amount field to support more decimal places
        migrations.AlterField(
            model_name='order',
            name='amount',
            field=models.DecimalField(
                decimal_places=8,
                help_text='Order amount with up to 8 decimal places',
                max_digits=18
            ),
        ),
    ]
