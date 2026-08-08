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


def split_into_chunks(text: str, act: str, source_name: str, year: int = None, status: str = "unknown", source: str = "unknown", max_chars: int = 1400) -> list[dict]:
    # A robust section regex to capture "Section 281. Title.—Content"
    # Legal texts might have various forms. We'll split on "Section " or "Sec. " followed by number.
    # The new chunking strategy uses a regex split to keep entire sections together.
    
    # Split text into rough chunks using "Section [num]"
    parts = re.split(r"(?i)\n(?=section\s+\d+|sec\.?\s+\d+)", text)
    
    pieces = []
    counter = 1
    
    for part in parts:
        part = part.strip()
        if not part:
            continue
            
        # Try to detect section number and title in this part
        # Example: "Section 281. Rash driving.—(1) Whoever..."
        section_num = "unknown"
        title = "Legal text"
        
        match = re.search(r"^(?:section|sec\.?)\s+([0-9A-Za-z-]+)\.?\s+([^—\n]+)", part, flags=re.I)
        if match:
            section_num = match.group(1)
            title = match.group(2).strip()
        else:
            # Fallback if just numbered e.g. "281. Rash driving"
            match2 = re.search(r"^([0-9]+[A-Z]?)\.\s+([A-Z][^—\n]+)", part)
            if match2:
                section_num = match2.group(1)
                title = match2.group(2).strip()
        
        # We may still need to sub-chunk if a single section is extremely long (over 2000 chars)
        # to fit well in the embedding model context window.
        sub_parts = []
        if len(part) > 2000:
            start = 0
            while start < len(part):
                end = min(start + 1800, len(part))
                if end < len(part):
                    boundary = part.rfind(". ", start, end)
                    if boundary > start + 500:
                        end = boundary + 1
                sub_parts.append(part[start:end].strip())
                start = end
        else:
            sub_parts = [part]
            
        for sub in sub_parts:
            if not sub:
                continue
            pieces.append({
                "id": f"{act.lower()}-{source_name}-{section_num}-{counter}",
                "text": sub,
                "act": act.upper(),
                "section": section_num,
                "title": title,
                "page": _page_hint(sub),
                "year": year,
                "status": status,
                "source": source
            })
            counter += 1
            
    return pieces


def _page_hint(text: str) -> str:
    match = re.search(r"\[PAGE\s+(\d+)\]", text)
    return match.group(1) if match else "unknown"
