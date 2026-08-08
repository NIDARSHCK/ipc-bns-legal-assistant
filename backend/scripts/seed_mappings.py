import sys
from pathlib import Path
from dotenv import load_dotenv

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from core.section_mapping import get_mappings
from database.supabase_db import supabase


def main() -> None:
    load_dotenv()
    client = supabase()
    if not client:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.")

    result = (
        client.table("section_mappings")
        .upsert(get_mappings(), on_conflict="ipc_section")
        .execute()
    )
    print(f"Seeded {len(result.data or [])} IPC-BNS mappings.")


if __name__ == "__main__":
    main()
