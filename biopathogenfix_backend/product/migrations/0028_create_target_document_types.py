from django.db import migrations


def create_target_document_types(apps, schema_editor):
    DocumentType = apps.get_model('documet', 'DocumentType')
    defaults = [
        ('Target List', 10),
        ('Product Target List', 11),
        ('Custom Target List', 12),
    ]
    for name, sort_order in defaults:
        DocumentType.objects.get_or_create(
            name=name,
            defaults={'sort_order': sort_order},
        )


def remove_target_document_types(apps, schema_editor):
    DocumentType = apps.get_model('documet', 'DocumentType')
    DocumentType.objects.filter(
        name__in=['Target List', 'Product Target List', 'Custom Target List']
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('documet', '0001_initial'),
        ('product', '0027_assaypaneltargetdocument'),
    ]

    operations = [
        migrations.RunPython(create_target_document_types, remove_target_document_types),
    ]
