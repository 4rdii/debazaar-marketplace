# Generated manually for digital goods categorization update

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0005_alter_listing_category'),
    ]

    operations = [
        # Update category choices
        migrations.AlterField(
            model_name='listing',
            name='category',
            field=models.CharField(
                choices=[
                    ('online_courses', 'Online Courses & Training'),
                    ('ebooks_guides', 'E-books & Guides'),
                    ('research_reports', 'Research Reports & Playbooks'),
                    ('cheat_sheets', 'Cheat Sheets & Templates'),
                    ('graphic_design', 'Graphic Design Templates'),
                    ('website_themes', 'Website Themes & UI Kits'),
                    ('stock_media', 'Stock Photography & Illustrations'),
                    ('video_templates', 'Video Editing Templates'),
                    ('code_scripts', 'Scripts & Code Snippets'),
                    ('dev_tools', 'Developer Tools & Plugins'),
                    ('extensions', 'Browser Extensions & Add-ons'),
                    ('spreadsheets', 'Spreadsheets & Dashboards'),
                    ('business_templates', 'Business Templates & Documents'),
                    ('marketing_kits', 'Marketing Kits & Creatives'),
                    ('automation_workflows', 'Automation Workflows'),
                    ('consulting', 'Consulting & Advisory'),
                    ('custom_development', 'Custom Development'),
                    ('design_services', 'Design Services'),
                    ('other', 'Other Digital Products'),
                ],
                default='other',
                max_length=30
            ),
        ),
        
        # Add new fields for delivery and arbitration methods
        migrations.AddField(
            model_name='listing',
            name='delivery_method',
            field=models.CharField(
                choices=[
                    ('file_download', 'File Download'),
                    ('encrypted_link', 'Encrypted Download Link'),
                    ('streaming_access', 'Streaming Access'),
                    ('repository_access', 'Repository Access'),
                    ('email_delivery', 'Email Delivery'),
                    ('custom_delivery', 'Custom Delivery Method'),
                ],
                default='file_download',
                max_length=20
            ),
        ),
        
        migrations.AddField(
            model_name='listing',
            name='arbitration_method',
            field=models.CharField(
                choices=[
                    ('file_hash_verification', 'File Hash Verification'),
                    ('content_audit', 'Content Audit'),
                    ('usage_verification', 'Usage Verification'),
                    ('expert_review', 'Expert Review'),
                    ('community_voting', 'Community Voting'),
                    ('automated_testing', 'Automated Testing'),
                ],
                default='file_hash_verification',
                max_length=25
            ),
        ),
        
        migrations.AddField(
            model_name='listing',
            name='file_hash',
            field=models.CharField(
                blank=True,
                help_text='SHA-256 hash for file verification',
                max_length=64,
                null=True
            ),
        ),
        
        migrations.AddField(
            model_name='listing',
            name='access_duration_days',
            field=models.IntegerField(
                default=30,
                help_text='Number of days buyer has access to content'
            ),
        ),
        
        migrations.AddField(
            model_name='listing',
            name='requires_license_key',
            field=models.BooleanField(
                default=False,
                help_text='Whether product requires license key activation'
            ),
        ),
    ]

