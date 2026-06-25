from django.core.management.base import BaseCommand

from ai.ingest import create_chunks, create_embeddings, fetch_documents


class Command(BaseCommand):
    help = "Sync admin KnowledgeBaseEntry content into preprocessed_db (admin-only mode)"

    def handle(self, *args, **options):
        documents = fetch_documents()
        if not documents:
            self.stdout.write(
                self.style.WARNING(
                    "No active KnowledgeBaseEntry content found. Continuing to clean stale vectors."
                )
            )

        chunks = create_chunks(documents)
        create_embeddings(chunks)
        self.stdout.write(self.style.SUCCESS("Ingestion complete"))
