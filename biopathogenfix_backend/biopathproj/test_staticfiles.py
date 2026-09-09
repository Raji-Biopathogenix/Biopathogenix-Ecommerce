from tempfile import TemporaryDirectory

from django.core.management import call_command
from django.http import HttpResponse
from django.test import RequestFactory, SimpleTestCase, override_settings
from whitenoise.middleware import WhiteNoiseMiddleware


class ProductionStaticFilesTests(SimpleTestCase):
    def test_admin_assets_served_without_debug(self):
        with TemporaryDirectory() as static_root:
            with override_settings(DEBUG=False, STATIC_ROOT=static_root):
                call_command("collectstatic", interactive=False, verbosity=0)
                handler = WhiteNoiseMiddleware(lambda request: HttpResponse(status=404))
                for path, content_type in (
                    ("/static/admin/css/base.css", "text/css"),
                    ("/static/admin/js/theme.js", "javascript"),
                ):
                    with self.subTest(path=path):
                        response = handler(RequestFactory().get(path))
                        try:
                            self.assertEqual(response.status_code, 200)
                            self.assertIn(content_type, response["Content-Type"])
                        finally:
                            response.close()
                self.assertEqual(handler(RequestFactory().get("/media/missing.jpg")).status_code, 404)
