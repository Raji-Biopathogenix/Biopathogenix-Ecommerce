from django.conf import settings
from django.http import HttpResponse
from django.middleware.csrf import CsrfViewMiddleware, get_token
from django.test import RequestFactory, SimpleTestCase, override_settings


@override_settings(ALLOWED_HOSTS=['api.biopathogenix.com'])
class AdminCsrfTests(SimpleTestCase):
    def check_post(self, origin, include_token=True):
        factory = RequestFactory()
        page = factory.get('/admin/login/', HTTP_HOST='api.biopathogenix.com')
        token = get_token(page)
        request = factory.post(
            '/admin/login/',
            {'csrfmiddlewaretoken': token} if include_token else {},
            HTTP_HOST='api.biopathogenix.com',
            HTTP_ORIGIN=origin,
        )
        request.COOKIES[settings.CSRF_COOKIE_NAME] = page.META['CSRF_COOKIE']
        view = lambda request: HttpResponse('OK')
        middleware = CsrfViewMiddleware(view)
        return middleware.process_view(request, view, (), {})

    def test_public_https_origin_accepted_over_http_upstream(self):
        self.assertIsNone(self.check_post('https://api.biopathogenix.com'))

    def test_untrusted_origin_rejected(self):
        self.assertEqual(self.check_post('https://untrusted.example').status_code, 403)

    def test_missing_token_rejected(self):
        self.assertEqual(
            self.check_post('https://api.biopathogenix.com', include_token=False).status_code,
            403,
        )
