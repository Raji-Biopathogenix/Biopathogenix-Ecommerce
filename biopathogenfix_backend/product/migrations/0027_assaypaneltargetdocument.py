from django.core.validators import FileExtensionValidator
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0026_allow_excel_product_documents'),
    ]

    operations = [
        migrations.CreateModel(
            name='AssayPanelTargetDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('panel_type', models.CharField(choices=[
                    ('all', 'All Assay Panels'),
                    ('respiratory', 'RPP / Respiratory'),
                    ('uti', 'UTI (Urinary Tract Infection)'),
                    ('sti', 'STI / Urogenital'),
                    ('wound', 'Wound and Nail'),
                    ('gi', 'Gastrointestinal'),
                    ('meningitis', 'Meningitis'),
                    ('sepsis', 'Sepsis'),
                    ('other', 'Other'),
                ], db_index=True, max_length=30)),
                ('document_type', models.CharField(choices=[
                    ('all_targets', 'All Targets List'),
                    ('custom_targets', 'Custom Targets List'),
                    ('panel_targets', 'Panel Targets List'),
                ], db_index=True, default='panel_targets', max_length=30)),
                ('title', models.CharField(max_length=255)),
                ('file', models.FileField(max_length=500, upload_to='assay_target_docs/%Y/%m/%d/', validators=[FileExtensionValidator(['pdf', 'doc', 'docx', 'xls', 'xlsx'])])),
                ('sort_order', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(db_index=True, default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Assay Target Document',
                'verbose_name_plural': 'Assay Target Documents',
                'ordering': ['panel_type', 'document_type', 'sort_order', 'id'],
            },
        ),
        migrations.AddIndex(
            model_name='assaypaneltargetdocument',
            index=models.Index(fields=['panel_type', 'document_type', 'is_active', 'sort_order'], name='product_ass_panel_t_763ff1_idx'),
        ),
    ]
