import os

from django.contrib import admin, messages
from django.core.management import call_command
from django.http import JsonResponse
from django.urls import path

from .models import KnowledgeBaseEntry, PathogenPanelLookup

SUPPORTED_EXTENSIONS = {".txt", ".md", ".text", ".rst", ".pdf", ".docx", ".csv"}


def _parse_file_content(file_obj, filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()

    if ext in (".txt", ".md", ".text", ".rst"):
        return file_obj.read().decode("utf-8", errors="replace")

    if ext == ".pdf":
        try:
            import pypdf
            from io import BytesIO
            data = file_obj.read()
            reader = pypdf.PdfReader(BytesIO(data))
            return "\n\n".join(page.extract_text() or "" for page in reader.pages).strip()
        except ImportError:
            try:
                import PyPDF2
                from io import BytesIO
                reader = PyPDF2.PdfReader(BytesIO(file_obj.read()))
                return "\n\n".join(page.extract_text() or "" for page in reader.pages).strip()
            except ImportError:
                raise ValueError("PDF support requires pypdf: pip install pypdf")

    if ext == ".docx":
        try:
            import docx
            from io import BytesIO
            doc = docx.Document(BytesIO(file_obj.read()))
            return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
        except ImportError:
            raise ValueError("DOCX support requires python-docx: pip install python-docx")

    if ext == ".csv":
        import pandas as pd
        from io import BytesIO
        df = pd.read_csv(BytesIO(file_obj.read()))
        return df.to_string(index=False)

    raise ValueError(f"Unsupported file type: {ext}. Supported: {', '.join(SUPPORTED_EXTENSIONS)}")


@admin.action(description="Run KnowledgeBaseEntry ingestion now")
def run_ingestion(_modeladmin, request, _queryset):
    try:
        call_command("ingest_kb")
    except Exception as exc:
        messages.error(request, f"Ingestion failed: {exc}")
        return
    messages.success(request, "KnowledgeBaseEntry ingestion completed.")


@admin.register(KnowledgeBaseEntry)
class KnowledgeBaseEntryAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "title",
        "doc_type",
        "access",
        "sort_order",
        "is_active",
        "updated_at",
    ]
    list_filter = ["doc_type", "access", "is_active", "updated_at"]
    search_fields = ["title", "content", "doc_type"]
    list_editable = ["sort_order", "is_active"]
    actions = [run_ingestion]
    change_list_template = "admin/chatbot/knowledgebaseentry/change_list.html"

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                "upload-files/",
                self.admin_site.admin_view(self.upload_files_view),
                name="chatbot_knowledgebaseentry_upload",
            ),
        ]
        return custom + urls

    def upload_files_view(self, request):
        if request.method != "POST":
            return JsonResponse({"error": "POST only"}, status=405)

        files = request.FILES.getlist("files")
        if not files:
            return JsonResponse({"error": "No files provided"}, status=400)

        results = []
        for f in files:
            try:
                content = _parse_file_content(f, f.name)
                if not content.strip():
                    results.append({"file": f.name, "status": "error", "message": "File is empty"})
                    continue
                title = os.path.splitext(f.name)[0].replace("_", " ").replace("-", " ").title()
                entry = KnowledgeBaseEntry.objects.create(
                    title=title,
                    content=content,
                    doc_type="other",
                    access="public",
                    is_active=True,
                )
                results.append({"file": f.name, "id": entry.id, "title": title, "status": "ok"})
            except Exception as exc:
                results.append({"file": f.name, "status": "error", "message": str(exc)})

        return JsonResponse({"results": results})


@admin.register(PathogenPanelLookup)
class PathogenPanelLookupAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "pathogen_target",
        "panel_count",
        "is_active",
        "updated_at",
    ]
    list_filter = ["is_active", "updated_at"]
    search_fields = ["pathogen_target", "normalized_name"]
