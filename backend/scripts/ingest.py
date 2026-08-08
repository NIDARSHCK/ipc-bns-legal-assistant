import argparse
import sys
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from core.scraper import read_document, split_into_chunks
from core.vector_db import upsert_chunks


def main() -> None:
    parser = argparse.ArgumentParser(description="Load IPC/BNS legal text into Pinecone.")
    parser.add_argument("--file", required=True, help="Path to a .txt or .pdf legal source")
    parser.add_argument("--act", required=True, choices=["ipc", "bns"], help="Legal act namespace")
    args = parser.parse_args()

    text = read_document(args.file)
    source_name = Path(args.file).stem.lower().replace(" ", "-")
    chunks = split_into_chunks(text, act=args.act, source_name=source_name)
    upsert_chunks(namespace=args.act, chunks=chunks)
    print(f"Uploaded {len(chunks)} chunks to Pinecone namespace '{args.act}'.")


if __name__ == "__main__":
    main()
