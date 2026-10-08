from html.parser import HTMLParser

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse


class AdminLayoutParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.parents = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id') in ('toolbar', 'changelist-form', 'changelist-filter'):
            self.parents[attrs['id']] = list(self.stack)
        if tag not in ('input', 'img', 'meta', 'link', 'br', 'hr', 'source', 'wbr'):
            self.stack.append((tag, attrs.get('id'), attrs.get('class', '')))

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                return


class AdminListLayoutTests(TestCase):
    def test_every_model_keeps_search_and_table_in_one_column(self):
        user = get_user_model().objects.create(email='layout@example.test',
            is_staff=True, is_superuser=True, is_active=True)
        self.client.force_login(user)
        for model in admin.site._registry:
            opts = model._meta
            with self.subTest(model=opts.label):
                response = self.client.get(reverse(f'admin:{opts.app_label}_{opts.model_name}_changelist'))
                self.assertEqual(response.status_code, 200)
                parser = AdminLayoutParser()
                parser.feed(response.content.decode())
                for element in ('toolbar', 'changelist-form'):
                    if element not in parser.parents and element == 'toolbar':
                        continue  # Models without search fields have no toolbar.
                    self.assertIn(element, parser.parents)
                    ancestors = parser.parents[element]
                    self.assertTrue(any('biopath-admin-list-main' in node[2].split() for node in ancestors))
                if 'changelist-filter' in parser.parents:
                    self.assertFalse(any('biopath-admin-list-main' in node[2].split()
                        for node in parser.parents['changelist-filter']))
