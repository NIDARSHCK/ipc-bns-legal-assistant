import sys
from pathlib import Path
import asyncio

sys.path.append(str(Path(__file__).resolve().parent.parent))

from core.vector_db import search_legal_corpus

def main():
    queries = ["accident", "road rage", "cheating", "murder"]
    for q in queries:
        print(f"\n--- Testing Query: '{q}' ---")
        res = search_legal_corpus(q, namespace="bns_v2")
        print(f"Got {len(res)} results.")
        for r in res:
            print(f"  {r['act']} {r['section']} ({r['score']:.3f}): {r['title']}")

if __name__ == "__main__":
    main()
