# Generated by Django 5.1.6 on 2025-03-05 23:55

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_inventoryitem_status_inventoryitem_threshold_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='inventoryitem',
            name='supplier',
        ),
    ]
