import re
from pathlib import Path

from pypdf import PdfReader


def read_document(path: str) -> str:
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(path)

    if file_path.suffix.lower() == ".pdf":
        reader = PdfReader(str(file_path))
        pages = []
        for index, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            pages.append(f"\n[PAGE {index}]\n{text}")
        return "\n".join(pages)

    return file_path.read_text(encoding="utf-8")


def detect_section(text: str) -> str:
    match = re.search(r"\b(?:section|sec\.?)\s+([0-9A-Za-z-]+)", text, flags=re.I)
    if match:
        return match.group(1)
    
    match2 = re.search(r"\b([0-9]+[A-Z]?)\.\s+[A-Z]", text)
    if match2:
        return match2.group(1)
        
    return "unknown"


def split_into_chunks(text: str, act: str, source_name: str, year: int = None, status: str = "unknown", source: str = "unknown", max_chars: int = 2000) -> list[dict]:
    # Split text into rough chunks using either "Section 123." or "123. Title"
    parts = re.split(r"\n(?=(?:Section\s+|Sec\.?\s*)?\d+[A-Z]?\.\s+[A-Z])", text, flags=re.IGNORECASE)
    
    pieces = []
    
    # We will track the last seen page number
    current_page = "unknown"
    
    for part_index, part in enumerate(parts):
        # Update current page from the chunk if available
        page_hints = re.findall(r"\[PAGE\s+(\d+)\]", part)
        if page_hints:
            current_page = page_hints[-1] # The last page tag seen in this part
            
        part = part.strip()
        if not part:
            continue
            
        section_num = "unknown"
        title = "Legal text"
        
        # Match e.g. "Section 281. Rash driving.—" or "281. Rash driving ."
        match = re.search(r"^(?:Section\s+|Sec\.?\s*)?([0-9]+[A-Za-z-]*)\.\s+([^—\n.]+)", part, flags=re.IGNORECASE)
        if match:
            section_num = match.group(1).upper()
            title = match.group(2).strip()
        
        sub_parts = []
        if len(part) > max_chars:
            start = 0
            while start < len(part):
                end = min(start + max_chars - 200, len(part))
                if end < len(part):
                    boundary = part.rfind(". ", start, end)
                    if boundary > start + 500:
                        end = boundary + 1
                sub_parts.append(part[start:end].strip())
                start = end
        else:
            sub_parts = [part]
            
        for chunk_index, sub in enumerate(sub_parts):
            if len(sub) < 10:  # Skip tiny garbage chunks
                continue
            
            pieces.append({
                "id": f"{act.lower()}-{section_num}-{part_index}-{chunk_index}",
                "chunk_id": f"{act.upper()}_{section_num}_{chunk_index}",
                "text": sub,
                "act": act.upper(),
                "section": section_num,
                "parent_section": section_num,
                "title": title,
                "page": current_page,
                "year": year,
                "status": status,
                "source": source,
                "chunk_index": chunk_index
            })
            
    return pieces


def _page_hint(text: str) -> str:
    match = re.search(r"\[PAGE\s+(\d+)\]", text)
    return match.group(1) if match else "unknown"
