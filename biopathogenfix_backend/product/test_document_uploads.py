import io
import zipfile
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.forms import inlineformset_factory
from django.test import TestCase, override_settings

from documet.models import DocumentType
from product.models import Product, ProductDocument


def spreadsheet_bytes():
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w') as archive:
        archive.writestr('xl/workbook.xml', '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Targets" r:id="rId1"/></sheets></workbook>')
        archive.writestr('xl/_rels/workbook.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')
        archive.writestr('xl/worksheets/sheet1.xml', '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row><c r="A1" t="inlineStr"><is><t>Target</t></is></c></row><row><c r="A2" t="inlineStr"><is><t>Example</t></is></c></row></sheetData></worksheet>')
    return buffer.getvalue()


@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
class ProductDocumentUploadTests(TestCase):
    def setUp(self):
        media = TemporaryDirectory()
        self.addCleanup(media.cleanup)
        self.enterContext(override_settings(MEDIA_ROOT=media.name))
        user = get_user_model().objects.create(email='document-test@example.test')
        self.product = Product.objects.create(name='Upload test', sku='UPLOAD', price=10, created_by=user)
        self.section = DocumentType.objects.create(name='Target list')

    def test_upload_extraction_preserves_file_bytes_and_allows_later_edit(self):
        for name, content, expected in (
            ('targets.csv', b'Target\nExample\n', 'Target Example'),
            ('targets.xlsx', spreadsheet_bytes(), 'Target Example'),
            ('broken.xlsx', b'not a workbook', ''),
            ('instructions.pdf', b'%PDF-1.4\nexample', ''),
        ):
            with self.subTest(name=name):
                document = ProductDocument.objects.create(
                    product=self.product, section=self.section, title=name,
                    file=SimpleUploadedFile(name, content),
                )
                self.assertEqual(document.extracted_target_text, expected)
                with document.file.open('rb') as stored:
                    self.assertEqual(stored.read(), content)
                document.refresh_from_db()
                document.title = 'Edited title'
                document.save()
                document.refresh_from_db()
                self.assertEqual(document.title, 'Edited title')
                self.assertEqual(document.extracted_target_text, expected)

    def test_replace_existing_target_spreadsheet_from_product_document_formset(self):
        document = ProductDocument.objects.create(
            product=self.product, section=self.section, title='Target list',
            file=SimpleUploadedFile('old-targets.xlsx', spreadsheet_bytes()),
        )
        old_name = document.file.name
        content = spreadsheet_bytes()
        document_formset = inlineformset_factory(
            Product, ProductDocument,
            fields=['section', 'title', 'file', 'sku', 'target_search_text', 'sort_order', 'is_active'],
            extra=0,
        )
        formset = document_formset(
            instance=self.product, prefix='documents',
            data={
                'documents-TOTAL_FORMS': '1', 'documents-INITIAL_FORMS': '1',
                'documents-0-id': str(document.pk),
                'documents-0-section': str(self.section.pk),
                'documents-0-title': 'Target list',
                'documents-0-sort_order': '0', 'documents-0-is_active': 'on',
            },
            files={'documents-0-file': SimpleUploadedFile('new-targets.xlsx', content)},
        )
        self.assertTrue(formset.is_valid(), formset.errors)
        # CommentMixin.save_formset uses this same commit=False/save sequence.
        instances = formset.save(commit=False)
        self.assertEqual(len(instances), 1)
        instances[0].save()
        formset.save_m2m()
        document.refresh_from_db()
        self.assertNotEqual(document.file.name, old_name)
        self.assertEqual(document.extracted_target_text, 'Target Example')
        self.assertEqual(ProductDocument.objects.count(), 1)
        with document.file.open('rb') as stored:
            self.assertEqual(stored.read(), content)
