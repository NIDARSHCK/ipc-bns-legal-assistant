import os
import re
import time
from typing import Iterable

try:
    from pinecone import Pinecone
except ImportError:
    Pinecone = None

INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "legal-assistant")
TEXT_FIELD = "chunk_text"
MIN_MATCH_SCORE = float(os.getenv("PINECONE_MIN_MATCH_SCORE", "0.20"))
EMBED_MODEL = os.getenv("PINECONE_EMBED_MODEL", "llama-text-embed-v2")

_pc_instance = None

def pinecone_client() -> Pinecone:
    global _pc_instance
    if _pc_instance is None:
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise RuntimeError("PINECONE_API_KEY is missing in backend/.env")
        if Pinecone is None:
            raise RuntimeError("pinecone package is not installed")
        _pc_instance = Pinecone(api_key=api_key)
    return _pc_instance

def index():
    return pinecone_client().Index(INDEX_NAME)

def embed_text(text: str, input_type: str = "query") -> list[float]:
    for attempt in range(3):
        try:
            response = pinecone_client().inference.embed(
                model=EMBED_MODEL,
                inputs=[text],
                parameters={"input_type": input_type},
            )
            return response.data[0]["values"]
        except Exception as e:
            if attempt == 2:
                raise e
            time.sleep(1.5 * (attempt + 1))

def detect_exact_sections(query: str) -> list[dict]:
    """
    Parse a query to detect exact sections and potential Acts.
    Matches: "148", "Section 148", "BNS 148", "IPC 148", "section 148 BNS"
    Returns a list of dicts: [{"act": "BNS", "section": "148"}, ...]
    """
    results = []
    pattern = r"(?i)(?:(IPC|BNS)\s*)?(?:sec(?:tion)?\.?\s*)?(\d+[A-Za-z()/-]*)(?:\s*(IPC|BNS))?"
    matches = re.finditer(pattern, query)
    
    seen = set()
    for match in matches:
        act_prefix = match.group(1)
        section = match.group(2)
        act_suffix = match.group(3)
        
        act = None
        if act_prefix:
            act = act_prefix.upper()
        elif act_suffix:
            act = act_suffix.upper()
            
        if not re.search(r"\b" + re.escape(match.group(0)) + r"\b", query):
            continue
            
        key = f"{act}_{section}"
        if key not in seen:
            seen.add(key)
            results.append({"act": act, "section": section})
            
    return results

def run_with_retry(operation, *args, **kwargs):
    for attempt in range(3):
        try:
            return operation(*args, **kwargs)
        except Exception as e:
            if attempt == 2:
                raise e
            time.sleep(1.5 * (attempt + 1))

def search_legal_corpus(
    query: str,
    top_k: int = 5,
    force_act: str | None = None,
) -> list[dict]:
    idx = index()
    namespaces_to_search = ["ipc_v2", "bns_v2"]
    
    all_hits = []
    vector = None
    if not hasattr(idx, "search"):
        vector = embed_text(query, input_type="query")

    exact_sections = detect_exact_sections(query)
    
    for ns in namespaces_to_search:
        act_ns = ns.split('_')[0].upper()
        
        # 1. Exact Section Search (if detected)
        for exact in exact_sections:
            if exact["act"] and exact["act"] != act_ns:
                continue
                
            filter_exact = {"act": {"$eq": act_ns}, "section": {"$eq": exact["section"]}}
            
            if hasattr(idx, "search"):
                response = run_with_retry(
                    idx.search,
                    namespace=ns,
                    query={"inputs": {"text": query}, "top_k": top_k, "filter": filter_exact},
                    fields=["act", "section", "title", "page", TEXT_FIELD],
                )
                hits = response.get("result", {}).get("hits", [])
                for h in hits:
                    h["_score"] = h.get("_score", 0) + 0.5 
                all_hits.extend(hits)
            else:
                response = run_with_retry(
                    idx.query,
                    namespace=ns, vector=vector, top_k=top_k, include_metadata=True, filter=filter_exact
                )
                hits = response.get("matches", [])
                for h in hits:
                    h["score"] = h.get("score", 0) + 0.5
                all_hits.extend(hits)
                
        # 2. Semantic Search (Broad)
        filter_semantic = {"act": {"$eq": act_ns}}
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
    
    for hit in all_hits:
        hit_id = hit.get("_id") or hit.get("id")
        if hit_id in seen_ids:
            continue
        seen_ids.add(hit_id)
        
        score = hit.get("_score") or hit.get("score") or 0
        if score < MIN_MATCH_SCORE and score < 0.5:
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
    return results[:top_k]
