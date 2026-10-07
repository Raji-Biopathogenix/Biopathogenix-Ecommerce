import io
import logging
from contextlib import nullcontext
from unittest.mock import Mock, patch

from django.test import Client, SimpleTestCase, override_settings


class RequestErrorLoggingTests(SimpleTestCase):
    @override_settings(DEBUG=False, ALLOWED_HOSTS=["testserver"])
    def test_signup_failure_logs_traceback_without_exposing_it_to_customer(self):
        output = io.StringIO()
        handler = next(
            handler for handler in logging.getLogger("django.request").handlers
            if handler.name == "request_console"
        )
        serializer = Mock()
        serializer.is_valid.return_value = True
        serializer.save.side_effect = RuntimeError("signup diagnostic test failure")
        with patch.object(handler, "stream", output), patch("users.views.UserSerializer", return_value=serializer), patch("users.views.transaction.atomic", return_value=nullcontext()):
            response = Client(raise_request_exception=False).post(
                "/api/v1/signup/", {"email": "test@example.com"},
            )
        self.assertEqual(response.status_code, 500)
        self.assertIn("Internal Server Error: /api/v1/signup/", output.getvalue())
        self.assertIn("Traceback", output.getvalue())
        self.assertIn("signup diagnostic test failure", output.getvalue())
        self.assertNotIn(b"signup diagnostic test failure", response.content)
