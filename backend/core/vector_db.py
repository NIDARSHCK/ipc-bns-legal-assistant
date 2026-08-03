import os
import re
from typing import Iterable

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(path: str = ".env") -> bool:
        if not os.path.exists(path):
            return False
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip('"\'')
                os.environ.setdefault(key, value)
        return True

try:
    from pinecone import Pinecone
except ImportError:
    Pinecone = None

load_dotenv()


INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "legal-assistant")
TEXT_FIELD = "chunk_text"
MIN_MATCH_SCORE = float(os.getenv("PINECONE_MIN_MATCH_SCORE", "0.45"))


def pinecone_client() -> Pinecone:
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        raise RuntimeError("PINECONE_API_KEY is missing in backend/.env")
    if Pinecone is None:
        raise RuntimeError("pinecone package is not installed")
    return Pinecone(api_key=api_key)


def ensure_index() -> None:
    pc = pinecone_client()
    if not pc.has_index(INDEX_NAME):
        pc.create_index_for_model(
            name=INDEX_NAME,
            cloud=os.getenv("PINECONE_CLOUD", "aws"),
            region=os.getenv("PINECONE_REGION", "us-east-1"),
            embed={
                "model": os.getenv("PINECONE_EMBED_MODEL", "llama-text-embed-v2"),
                "field_map": {"text": TEXT_FIELD},
            },
        )


def index():
    ensure_index()
    return pinecone_client().Index(INDEX_NAME)


def search_legal_corpus(
    query: str,
    namespace: str,
    top_k: int = 5,
    exact_section: str | None = None,
) -> list[dict]:
    act = namespace.upper()

    filter_payload = {
        "act": {"$eq": act}
    }

    if exact_section:
        filter_payload["section"] = {
            "$eq": exact_section
        }
    response = index().search(
        namespace=namespace,
        query={
            "inputs": {"text": query},
            "top_k": top_k,
            "filter": filter_payload,
        },
        fields=["act", "section", "title", "page", TEXT_FIELD],
    )

    hits = response.get("result", {}).get("hits", [])
    results = []
    for hit in hits:
        score = hit.get("_score") or 0
        if score < MIN_MATCH_SCORE:
            continue
        fields = hit.get("fields", {})
        results.append(
            {
                "id": hit.get("_id"),
                "score": score,
                "act": fields.get("act"),
                "section": fields.get("section"),
                "title": fields.get("title"),
                "page": fields.get("page"),
                "text": fields.get(TEXT_FIELD),
            }
        )
    return results


def upsert_chunks(namespace: str, chunks: Iterable[dict]) -> None:
    records = []
    for chunk in chunks:
        records.append(
            {
                "_id": chunk["id"],
                TEXT_FIELD: chunk["text"],
                "act": chunk.get("act", namespace.upper()),
                "section": chunk.get("section", "unknown"),
                "title": chunk.get("title", "Legal text"),
                "page": chunk.get("page", "unknown"),
            }
        )

    if records:
        index().upsert_records(namespace, records)


def detect_section(text: str) -> str:
    match = re.search(r"\b(?:section|sec\.?)\s+([0-9A-Za-z-]+)", text, flags=re.I)
    return match.group(1) if match else "unknown"
