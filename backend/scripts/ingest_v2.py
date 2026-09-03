import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(str(Path(__file__).resolve().parent.parent / ".env"))

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from core.scraper import read_document, split_into_chunks
from core.vector_db import upsert_chunks, clear_namespace

def main() -> None:
    parser = argparse.ArgumentParser(description="Load IPC/BNS legal text into Pinecone V2 namespace safely.")
    parser.add_argument("--file", required=True, help="Path to a .txt or .pdf legal source")
    parser.add_argument("--act", required=True, choices=["ipc", "bns"], help="Legal act namespace")
    parser.add_argument("--namespace", required=True, help="Target Pinecone namespace (e.g. bns_v2)")
    parser.add_argument("--year", type=int, help="Year of the act")
    parser.add_argument("--status", type=str, default="current", help="Status of the act")
    parser.add_argument("--clear", action="store_true", help="Clear the namespace before inserting")
    args = parser.parse_args()

    if args.clear:
        clear_namespace(args.namespace)

    print(f"Reading {args.file}...")
    text = read_document(args.file)
    source_name = Path(args.file).stem.lower().replace(" ", "-")
    source_label = f"{args.act.upper()} {args.year}" if args.year else args.act.upper()
    
    print(f"Chunking document...")
    chunks = split_into_chunks(
        text=text, 
        act=args.act, 
        source_name=source_name,
        year=args.year,
        status=args.status,
        source=source_label
    )
    
    print(f"Generated {len(chunks)} chunks.")
    if len(chunks) > 0:
        upsert_chunks(namespace=args.namespace, chunks=chunks)
        print(f"Successfully uploaded {len(chunks)} chunks to Pinecone namespace '{args.namespace}'.")
    else:
        print("No chunks generated. Aborting upsert.")


if __name__ == "__main__":
    main()
