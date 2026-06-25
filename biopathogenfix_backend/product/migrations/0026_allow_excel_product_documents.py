from django.core.validators import FileExtensionValidator
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('product', '0025_pathogen_productassaydetail_productpathogen'),
    ]

    operations = [
        migrations.AlterField(
            model_name='productdocument',
            name='file',
            field=models.FileField(
                db_column='file_url',
                max_length=500,
                upload_to='product_docs/%Y/%m/%d/',
                validators=[FileExtensionValidator(['pdf', 'doc', 'docx', 'xls', 'xlsx'])],
            ),
        ),
    ]
