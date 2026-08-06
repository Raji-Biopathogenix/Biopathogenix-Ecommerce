"""
URL configuration for mysite project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include, re_path
from django.conf import settings
from django.views.static import serve


def cached_media_serve(request, path):
    response = serve(request, path, document_root=settings.MEDIA_ROOT)
    response['Cache-Control'] = 'public, max-age=2592000, immutable'  # 30 days
    return response


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('api.urls')),
    path('api/', include('api.urls')),
    path('api/v1/', include('chatbot.urls')),
    path('api/', include('chatbot.urls')),
]

# django.conf.urls.static.static() silently no-ops unless DEBUG=True,
# so it can never actually serve media in production regardless of how
# it's called — register the real view directly, unconditionally.
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', cached_media_serve),
]
