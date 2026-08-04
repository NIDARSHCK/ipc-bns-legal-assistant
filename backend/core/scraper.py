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


def split_into_chunks(text: str, act: str, source_name: str, max_chars: int = 1400) -> list[dict]:
    normalized = re.sub(r"\s+", " ", text).strip()
    pieces = []
    start = 0
    counter = 1
    current_section = "unknown"

    while start < len(normalized):
        end = min(start + max_chars, len(normalized))
        if end < len(normalized):
            boundary = normalized.rfind(". ", start, end)
            if boundary > start + 500:
                end = boundary + 1

        chunk_text = normalized[start:end].strip()
        if chunk_text:
            section = detect_section(chunk_text)
            if section != "unknown":
                current_section = section
            elif current_section != "unknown":
                section = current_section
            
            pieces.append(
                {
                    "id": f"{act.lower()}-{source_name}-{counter}",
                    "text": chunk_text,
                    "act": act.upper(),
                    "section": section,
                    "title": f"{act.upper()} Section {section} chunk {counter}",
                    "page": _page_hint(chunk_text),
                }
            )
            counter += 1
        start = end

    return pieces


def _page_hint(text: str) -> str:
    match = re.search(r"\[PAGE\s+(\d+)\]", text)
    return match.group(1) if match else "unknown"
