from __future__ import annotations
import hashlib
import os
from collections import defaultdict
from pathlib import Path
from typing import Any, cast
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


def _load_env() -> None:
    env_file_path = os.getenv("ENV_FILE_PATH") or os.getenv("DOTENV_FILE_PATH")
    if env_file_path:
        load_dotenv(dotenv_path=env_file_path, override=True)
    else:
        load_dotenv(override=True)


_load_env()

BASE_DIR = Path(__file__).resolve().parent.parent
DB_DIR = BASE_DIR / "preprocessed_db"
EMBEDDING_MODEL = os.getenv("RAG_EMBEDDING_MODEL", "text-embedding-3-large")
COLLECTION_NAME = os.getenv("RAG_COLLECTION_NAME", "docs")
KB_ENTRY_SOURCE_PREFIX = "db://chatbot/knowledgebaseentry/"


def fetch_documents():
    return _fetch_admin_documents()


def _fetch_admin_documents():
    # Import and setup Django lazily so standalone script usage still works.
    try:
        import django
        from django.apps import apps
    except Exception:
        return []

    try:
        if not apps.ready:
            os.environ.setdefault("DJANGO_SETTINGS_MODULE", "biopathproj.settings")
            django.setup()

        KnowledgeBaseEntry = apps.get_model("chatbot", "KnowledgeBaseEntry")
    except Exception:
        return []

    try:
        from django.db import OperationalError, ProgrammingError
    except Exception:
        return []

    documents = []
    try:
        entries = KnowledgeBaseEntry.objects.filter(is_active=True).order_by("sort_order", "id")
    except (OperationalError, ProgrammingError):
        # Keep legacy file-based ingestion working before migrations are applied.
        return []

    for entry_obj in entries:
        entry = cast(Any, entry_obj)
        content = str(entry.content or "").strip()
        if not content:
            continue

        documents.append(
            Document(
                page_content=content,
                metadata={
                    "source": f"{KB_ENTRY_SOURCE_PREFIX}{entry.id}",
                    "access": entry.access,
                    "doc_type": entry.doc_type,
                    "title": entry.title,
                    "source_type": "knowledgebaseentry",
                },
            )
        )

    return documents


def create_chunks(documents):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=200,
        add_start_index=True,
    )
    return splitter.split_documents(documents)


def _chunk_id(source: str, chunk_index: int) -> str:
    source_hash = hashlib.sha1(source.encode("utf-8")).hexdigest()[:16]
    return f"{source_hash}:{chunk_index}"


def _delete_stale_chunks_admin_only(vectorstore, active_sources: set[str]) -> int:
    """
    Admin-only mode:
    - Keep chunks for active KnowledgeBaseEntry sources.
    - Remove stale/deleted KnowledgeBaseEntry chunks.
    - Remove all non-admin chunks (legacy markdown/file chunks).
    """
    all_chunks = vectorstore._collection.get(include=["metadatas"])
    metadatas = all_chunks.get("metadatas") or []
    ids = all_chunks.get("ids") or []

    stale_ids = []
    for doc_id, metadata in zip(ids, metadatas):
        if not isinstance(metadata, dict):
            continue

        source = str(metadata.get("source", ""))
        source_type = str(metadata.get("source_type", ""))
        is_kb_entry_chunk = source.startswith(KB_ENTRY_SOURCE_PREFIX) or source_type == "knowledgebaseentry"
        if is_kb_entry_chunk and source not in active_sources:
            stale_ids.append(doc_id)
            continue

        if not is_kb_entry_chunk:
            stale_ids.append(doc_id)

    if stale_ids:
        vectorstore._collection.delete(ids=stale_ids)

    return len(stale_ids)


def create_embeddings(chunks):
    _load_env()
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError(
            "OPENAI_API_KEY is not set. Set ENV_FILE_PATH if your .env is outside this project."
        )

    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)
    vectorstore = Chroma(
        collection_name=COLLECTION_NAME,
        persist_directory=str(DB_DIR),
        embedding_function=embeddings,
    )

    chunks_by_source = defaultdict(list)
    for chunk in chunks:
        source = str(chunk.metadata.get("source", "unknown"))
        chunks_by_source[source].append(chunk)

    active_kb_entry_sources = {
        source for source in chunks_by_source.keys() if source.startswith(KB_ENTRY_SOURCE_PREFIX)
    }
    removed_chunks = _delete_stale_chunks_admin_only(vectorstore, active_kb_entry_sources)

    total_added = 0
    for source, source_chunks in chunks_by_source.items():
        source_chunks.sort(key=lambda doc: int(doc.metadata.get("start_index", 0)))

        # Replace chunks only for this source; all other products remain untouched.
        vectorstore._collection.delete(where={"source": source})

        ids = []
        for index, doc in enumerate(source_chunks):
            doc.metadata["chunk_index"] = index
            ids.append(_chunk_id(source, index))

        vectorstore.add_documents(source_chunks, ids=ids)
        total_added += len(source_chunks)

    count = vectorstore._collection.count()
    print(
        f"Synced {len(chunks_by_source)} admin sources, added/updated {total_added} chunks, "
        f"removed {removed_chunks} stale/non-admin chunks, "
        f"collection now has {count} chunks."
    )
    return vectorstore


if __name__ == "__main__":
    docs = fetch_documents()
    chunks = create_chunks(docs)
    create_embeddings(chunks)
    print("Ingestion complete")
