from django.urls import path
from .views import AssayIntakeCreateView, ChatView, ContactFormView, PathogenLookupSearchView


urlpatterns = [
    path("chat/", ChatView.as_view(), name="chat"),
    path("chat", ChatView.as_view(), name="chat_no_slash"),
    path("pathogen-lookup/", PathogenLookupSearchView.as_view(), name="pathogen_lookup"),
    path("pathogen-lookup", PathogenLookupSearchView.as_view(), name="pathogen_lookup_no_slash"),
    path("assay-intake/", AssayIntakeCreateView.as_view(), name="assay_intake"),
    path("assay-intake", AssayIntakeCreateView.as_view(), name="assay_intake_no_slash"),
    path("contact-form/", ContactFormView.as_view(), name="contact_form"),
    path("contact-form", ContactFormView.as_view(), name="contact_form_no_slash"),
]
  
