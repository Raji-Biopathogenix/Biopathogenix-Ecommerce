from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0024_product_is_shipping_required'),
    ]

    operations = [
        migrations.CreateModel(
            name='Pathogen',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(db_index=True, max_length=255)),
                ('scientific_name', models.CharField(blank=True, max_length=255)),
                ('pathogen_type', models.CharField(
                    choices=[
                        ('viral', 'Viral'),
                        ('bacterial', 'Bacterial'),
                        ('fungal', 'Fungal'),
                        ('parasitic', 'Parasitic'),
                        ('protozoal', 'Protozoal'),
                        ('other', 'Other'),
                    ],
                    db_index=True,
                    default='bacterial',
                    max_length=20,
                )),
                ('is_active', models.BooleanField(db_index=True, default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Pathogen',
                'verbose_name_plural': 'Pathogens',
                'ordering': ['pathogen_type', 'name'],
            },
        ),
        migrations.CreateModel(
            name='ProductAssayDetail',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('assay_type', models.CharField(
                    choices=[
                        ('respiratory', 'Respiratory'),
                        ('uti', 'UTI (Urinary Tract Infection)'),
                        ('sti', 'STI (Sexually Transmitted Infection)'),
                        ('wound', 'Wound Panel'),
                        ('gi', 'Gastrointestinal'),
                        ('meningitis', 'Meningitis'),
                        ('sepsis', 'Sepsis'),
                        ('other', 'Other'),
                    ],
                    db_index=True,
                    max_length=30,
                )),
                ('reaction_format', models.CharField(blank=True, help_text='e.g. 96-well / 384-well', max_length=100)),
                ('panel_name', models.CharField(blank=True, help_text='Short display name for the panel', max_length=255)),
                ('is_active', models.BooleanField(db_index=True, default=True)),
                ('product', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='assay_detail',
                    to='product.product',
                )),
            ],
            options={
                'verbose_name': 'Product Assay Detail',
                'verbose_name_plural': 'Product Assay Details',
            },
        ),
        migrations.CreateModel(
            name='ProductPathogen',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sort_order', models.PositiveIntegerField(default=0)),
                ('pathogen', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='product_pathogens',
                    to='product.pathogen',
                )),
                ('product', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='product_pathogens',
                    to='product.product',
                )),
            ],
            options={
                'verbose_name': 'Product Pathogen',
                'verbose_name_plural': 'Product Pathogens',
                'ordering': ['sort_order', 'pathogen__name'],
                'unique_together': {('product', 'pathogen')},
            },
        ),
    ]
