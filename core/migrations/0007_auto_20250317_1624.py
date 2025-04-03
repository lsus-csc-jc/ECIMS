# core/migrations/0007_auto_YYYYMMDD_HHMM.py

from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
    ('core', '0006_order_expected_delivery_order_product_order_quantity_and_more'),
]


    operations = [
        migrations.AddField(
            model_name='profile',
            name='role',
            field=models.CharField(
                max_length=20,
                choices=[('Manager', 'Manager'), ('Employee', 'Employee')],
                default='Employee'
            ),
        ),
    ]
