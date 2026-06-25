from __future__ import annotations
import os
import re
from pathlib import Path
from typing import Any
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from .intake import IntakeFormPayload, get_intake_form_intent


def _load_env() -> None:
    env_file_path = os.getenv("ENV_FILE_PATH") or os.getenv("DOTENV_FILE_PATH")
    if env_file_path:
        load_dotenv(dotenv_path=env_file_path, override=True)
    else:
        load_dotenv(override=True)


_load_env()


def _int_env(name: str, default: int, minimum: int = 1) -> int:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    try:
        value = int(raw_value)
    except ValueError:
        return default
    return max(value, minimum)


MODEL = os.getenv("RAG_CHAT_MODEL", "gpt-4.1-nano")
EMBEDDING_MODEL = os.getenv("RAG_EMBEDDING_MODEL", "text-embedding-3-large")
DB_NAME = str(Path(__file__).resolve().parent.parent / "preprocessed_db")
COLLECTION_NAME = os.getenv("RAG_COLLECTION_NAME", "docs")
RETRIEVAL_K = _int_env("RAG_RETRIEVAL_K", 4)
MAX_HISTORY_USER_TURNS = _int_env("RAG_HISTORY_USER_TURNS", 4)
MAX_HISTORY_MESSAGES = _int_env("RAG_MAX_HISTORY_MESSAGES", 8, minimum=0)
MAX_QUERY_CHARS = _int_env("RAG_MAX_QUERY_CHARS", 1200)
MAX_DOC_CHARS = _int_env("RAG_MAX_DOC_CHARS", 1300)
MAX_CONTEXT_CHARS = _int_env("RAG_MAX_CONTEXT_CHARS", 6000)
MAX_OUTPUT_TOKENS = _int_env("RAG_MAX_OUTPUT_TOKENS", 280)

SYSTEM_PROMPT = """
You are a knowledgeable, friendly assistant representing the company BioPathogenix.
You are chatting with a user about BioPathogenix.
You must ONLY answer questions related to BioPathogenix:
- company information
- products, assays, kits, reagents, lab supplies
- product documents (SDS, IFU, CoA) and categories
- ordering, shipping, quotes, support, and customer help related to BioPathogenix
If the user asks about any other topic, politely refuse and ask them to ask a BioPathogenix-related question.
If you do not know the answer, say so.
Use plain English and ASCII punctuation only. Use ' and - instead of curly quotes or long dashes.

IMPORTANT - ordering and quotes:
You cannot place orders, generate quotes, process payments, or check inventory.
If a user asks to place an order, get a quote, or requests pricing, do NOT pretend to prepare one.
Instead, immediately direct them to the sales team:
  Email: order@biopathogenix.com
  Phone: (859) 605-5866
Never say 'I will prepare a quote' or 'please hold on while I gather details' - you have no ability to do this.

Context:
{context}
"""

OFF_TOPIC_REPLY = (
    "I can only help with BioPathogenix-related questions. "
    "Please ask about BioPathogenix products, services, documents, orders, or support."
)

DOMAIN_KEYWORDS = (
    "biopathogenix",
    "bio pathogenix",
    "product",
    "products",
    "assay",
    "assays",
    "kit",
    "kits",
    "reagent",
    "reagents",
    "pcr",
    "extraction",
    "dna",
    "rna",
    "sds",
    "ifu",
    "coa",
    "category",
    "categories",
    "quote",
    "pricing",
    "order",
    "shipping",
    "support",
    "customer service",
    "lab",
    "laboratory",
    "specimen",
    "sample",
    "company",
)

OFF_TOPIC_KEYWORDS = (
    "weather",
    "temperature",
    "rain",
    "movie",
    "film",
    "song",
    "lyrics",
    "celebrity",
    "football",
    "basketball",
    "cricket",
    "soccer",
    "nfl",
    "nba",
    "ipl",
    "politics",
    "president",
    "prime minister",
    "election",
    "bitcoin",
    "crypto",
    "stock market",
    "travel",
    "flight",
    "hotel",
    "visa",
    "recipe",
    "cooking",
    "restaurant",
    "horoscope",
    "astrology",
    "joke",
    "riddle",
)

_retriever = None
_llm = None


def _get_clients():
    global _retriever, _llm

    if _retriever is not None and _llm is not None:
        return _retriever, _llm

    _load_env()
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError(
            "OPENAI_API_KEY is not set. If your .env is outside this project, "
            "set ENV_FILE_PATH to the absolute path of that file before starting Django."
        )

    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)
    vectorstore = Chroma(
        collection_name=COLLECTION_NAME,
        persist_directory=DB_NAME,
        embedding_function=embeddings,
    )
    _retriever = vectorstore.as_retriever(search_kwargs={"k": RETRIEVAL_K})
    _llm = ChatOpenAI(
        temperature=0,
        model=MODEL,
        model_kwargs={"max_tokens": MAX_OUTPUT_TOKENS},
    )
    return _retriever, _llm


def _normalize_reply(text: str) -> str:
    fixed = text

    for _ in range(2):
        if any(marker in fixed for marker in ("\u00e2", "\u00c3", "\u00c2", "\u20ac")):
            repaired = fixed
            for source_encoding in ("cp1252", "latin-1"):
                try:
                    repaired = fixed.encode(source_encoding).decode("utf-8")
                    break
                except UnicodeError:
                    continue
            if repaired == fixed:
                break
            fixed = repaired
        else:
            break

    punctuation_map = str.maketrans(
        {
            "\u2019": "'",
            "\u2018": "'",
            "\u201c": '"',
            "\u201d": '"',
            "\u2014": "-",
            "\u2013": "-",
        }
    )
    return fixed.translate(punctuation_map).replace("\u00a0", " ")


def _history_to_messages(history: list[dict[str, Any]]) -> list:
    messages = []
    for entry in history:
        if not isinstance(entry, dict):
            continue
        role = str(entry.get("role", "")).lower().strip()
        content = str(entry.get("content", "")).strip()
        if not content:
            continue
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role in {"assistant", "ai"}:
            messages.append(AIMessage(content=content))
        elif role == "system":
            messages.append(SystemMessage(content=content))

    if MAX_HISTORY_MESSAGES > 0:
        messages = messages[-MAX_HISTORY_MESSAGES:]
    return messages


def fetch_context(question: str) -> list[Document]:
    retriever, _ = _get_clients()
    return retriever.invoke(question)


def _truncate_from_end(text: str, limit: int) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    return text[-limit:]


def _normalize_text_for_match(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def _has_any_keyword(text: str, keywords: tuple[str, ...]) -> bool:
    normalized = _normalize_text_for_match(text)
    return any(keyword in normalized for keyword in keywords)


def _is_out_of_scope_question(question: str) -> bool:
    if _has_any_keyword(question, DOMAIN_KEYWORDS):
        return False
    return _has_any_keyword(question, OFF_TOPIC_KEYWORDS)


def _remove_duplicate_latest_user_turn(
    history: list[dict[str, Any]], question: str
) -> list[dict[str, Any]]:
    if not history:
        return history

    question_text = question.strip()
    if not question_text:
        return history

    last = history[-1]
    if not isinstance(last, dict):
        return history

    role = str(last.get("role", "")).lower().strip()
    content = str(last.get("content", "")).strip()
    if role == "user" and content == question_text:
        return history[:-1]
    return history


def combined_question(question: str, history: list[dict[str, Any]] | None = None) -> str:
    history = history or []
    prior_user_messages = [
        str(message.get("content", "")).strip()
        for message in history
        if isinstance(message, dict) and str(message.get("role", "")).lower() == "user"
    ]
    if MAX_HISTORY_USER_TURNS > 0:
        prior_user_messages = prior_user_messages[-MAX_HISTORY_USER_TURNS:]

    prior = "\n".join(message for message in prior_user_messages if message)
    combined = f"{prior}\n{question}".strip() if prior else question
    return _truncate_from_end(combined, MAX_QUERY_CHARS)


def _build_context(docs: list[Document]) -> str:
    if MAX_CONTEXT_CHARS <= 0:
        return ""

    remaining = MAX_CONTEXT_CHARS
    parts: list[str] = []

    for doc in docs:
        page_content = str(getattr(doc, "page_content", "") or "").strip()
        if not page_content:
            continue

        snippet = page_content[:MAX_DOC_CHARS]
        if len(snippet) > remaining:
            snippet = snippet[:remaining]
        if not snippet:
            break

        parts.append(snippet)
        remaining -= len(snippet)
        if remaining <= 2:
            break

        parts.append("\n\n")
        remaining -= 2

    return "".join(parts).strip()


def answer_question(
    question: str, history: list[dict[str, Any]] | None = None
) -> tuple[str, list[Document]]:
    if _is_out_of_scope_question(question):
        return OFF_TOPIC_REPLY, []

    history = history or []
    history = _remove_duplicate_latest_user_turn(history, question)
    combined = combined_question(question, history)
    docs = fetch_context(combined)
    context = _build_context(docs)
    system_prompt = SYSTEM_PROMPT.format(context=context)

    messages: list[BaseMessage] = [SystemMessage(content=system_prompt)]
    messages.extend(_history_to_messages(history))
    messages.append(HumanMessage(content=question))

    _, llm = _get_clients()
    response = llm.invoke(messages)

    content = response.content
    if not isinstance(content, str):
        content = str(content)

    return _normalize_reply(content), docs


def answer_chat_request(
    question: str, history: list[dict[str, Any]] | None = None
) -> tuple[str, list[Document], IntakeFormPayload | None]:
    intake_form = get_intake_form_intent(question)
    if intake_form is not None:
        return intake_form["confirmation"], [], intake_form

    reply, docs = answer_question(question, history)
    return reply, docs, None
