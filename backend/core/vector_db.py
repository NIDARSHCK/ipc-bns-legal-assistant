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
MIN_MATCH_SCORE = float(os.getenv("PINECONE_MIN_MATCH_SCORE", "0.20"))
EMBED_MODEL = os.getenv("PINECONE_EMBED_MODEL", "llama-text-embed-v2")


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
    namespace: str | None = None,
    top_k: int = 5,
    exact_section: str | None = None,
) -> list[dict]:
    idx = index()
    # Search both namespaces to support automatic cross-referencing where appropriate
    namespaces_to_search = ["ipc_v2", "bns_v2"]
    
    all_hits = []
    vector = None
    if not hasattr(idx, "search"):
        vector = embed_texts([query], input_type="query")[0]

    import time
    def run_with_retry(operation, *args, **kwargs):
        for attempt in range(3):
            try:
                return operation(*args, **kwargs)
            except Exception as e:
                if attempt == 2:
                    raise e
                time.sleep(1.5 * (attempt + 1))

    for ns in namespaces_to_search:
        act = ns.split('_')[0].upper()
        
        # 1. Exact section search
        if exact_section:
            filter_exact = {"act": {"$eq": act}, "section": {"$eq": exact_section}}
            if hasattr(idx, "search"):
                response = run_with_retry(
                    idx.search,
                    namespace=ns,
                    query={"inputs": {"text": query}, "top_k": top_k, "filter": filter_exact},
                    fields=["act", "section", "title", "page", TEXT_FIELD],
                )
                all_hits.extend(response.get("result", {}).get("hits", []))
            else:
                response = run_with_retry(
                    idx.query,
                    namespace=ns, vector=vector, top_k=top_k, include_metadata=True, filter=filter_exact
                )
                all_hits.extend(response.get("matches", []))
                
        # 2. Semantic search
        filter_semantic = {"act": {"$eq": act}}
        if hasattr(idx, "search"):
            response = run_with_retry(
                idx.search,
                namespace=ns,
                query={"inputs": {"text": query}, "top_k": top_k, "filter": filter_semantic},
                fields=["act", "section", "title", "page", TEXT_FIELD],
            )
            all_hits.extend(response.get("result", {}).get("hits", []))
        else:
            response = run_with_retry(
                idx.query,
                namespace=ns, vector=vector, top_k=top_k, include_metadata=True, filter=filter_semantic
            )
            all_hits.extend(response.get("matches", []))

    results = []
    seen_ids = set()
    raw_scores = []
    
    for hit in all_hits:
        hit_id = hit.get("_id") or hit.get("id")
        if hit_id in seen_ids:
            continue
        seen_ids.add(hit_id)
        
        score = hit.get("_score") or hit.get("score") or 0
        raw_scores.append(score)
        
        if score < MIN_MATCH_SCORE:
            continue
            
        fields = hit.get("fields") or hit.get("metadata") or {}
        results.append(
            {
                "id": hit_id,
                "score": score,
                "act": fields.get("act"),
                "section": fields.get("section"),
                "title": fields.get("title"),
                "page": fields.get("page"),
                "text": fields.get(TEXT_FIELD),
            }
        )
        
    results.sort(key=lambda x: x["score"], reverse=True)
    results = results[:top_k]
    
    # Structured logging for debugging
    print("\n" + "="*50)
    print("PINECONE DIAGNOSTIC LOG")
    print("="*50)
    print(f"QUERY: {query}")
    print(f"NAMESPACE FILTER: {namespace}")
    print(f"EXACT SECTION: {exact_section}")
    print(f"EMBEDDING MODEL: {EMBED_MODEL}")
    print(f"PINECONE INDEX: {INDEX_NAME}")
    print(f"RAW HITS COUNT: {len(all_hits)}")
    if raw_scores:
        print("TOP 5 RAW SCORES:", sorted(raw_scores, reverse=True)[:5])
    print(f"ACCEPTED RESULTS (score >= {MIN_MATCH_SCORE}): {len(results)}")
    for i, res in enumerate(results):
        print(f"  Result {i+1}: Score={res['score']:.4f} | Act={res['act']} | Sec={res['section']} | Title={res['title']}")
    print("="*50 + "\n")
    
    return results


def upsert_chunks(namespace: str, chunks: Iterable[dict]) -> None:
    records = []
    for chunk in chunks:
        records.append(
            {
                "id": chunk["id"],
                TEXT_FIELD: chunk["text"],
                "act": chunk.get("act", namespace.upper()),
                "section": chunk.get("section", "unknown"),
                "title": chunk.get("title", "Legal text"),
                "page": chunk.get("page", "unknown"),
                "year": chunk.get("year"),
                "status": chunk.get("status", "unknown"),
                "source": chunk.get("source", "unknown"),
            }
        )

    if records:
        idx = index()
        if hasattr(idx, "upsert_records"):
            idx.upsert_records(namespace, [{"_id": item["id"], **{k: v for k, v in item.items() if k != "id"}} for item in records])
            return

        batch_size = 32
        for start in range(0, len(records), batch_size):
            batch = records[start : start + batch_size]
            vectors = embed_texts([item[TEXT_FIELD] for item in batch], input_type="passage")
            idx.upsert(
                namespace=namespace,
                vectors=[
                    {
                        "id": item["id"],
                        "values": values,
                        "metadata": {
                            "act": item["act"],
                            "section": item["section"],
                            "title": item["title"],
                            "page": item["page"],
                            "year": item.get("year"),
                            "status": item["status"],
                            "source": item["source"],
                            TEXT_FIELD: item[TEXT_FIELD],
                        },
                    }
                    for item, values in zip(batch, vectors)
                ],
            )


def embed_texts(texts: list[str], input_type: str) -> list[list[float]]:
    import time
    for attempt in range(3):
        try:
            response = pinecone_client().inference.embed(
                model=EMBED_MODEL,
                inputs=texts,
                parameters={"input_type": input_type},
            )
            return [item["values"] for item in response.data]
        except Exception as e:
            if attempt == 2:
                raise e
            time.sleep(1.5 * (attempt + 1))


