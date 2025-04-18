# Generated by Django 5.2 on 2025-04-14 22:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_remove_order_product_remove_order_quantity_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='inventoryitem',
            name='description',
        ),
        migrations.AlterField(
            model_name='inventoryitem',
            name='quantity',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='inventoryitem',
            name='status',
            field=models.IntegerField(choices=[(3, 'In Stock'), (2, 'Low Stock'), (1, 'Out of Stock'), (0, 'Unknown')], default=0),
        ),
        migrations.AlterField(
            model_name='inventoryitem',
            name='threshold',
            field=models.IntegerField(default=0),
        ),
    ]
