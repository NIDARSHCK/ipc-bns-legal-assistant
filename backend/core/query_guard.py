import re

LEGAL_TERMS = {
    "ipc", "bns", "bnss", "crpc", "fir", "bail", "court", "crime", "criminal",
    "offence", "offense", "punishment", "section", "act", "law", "legal",
    "police", "arrest", "complaint", "charge", "trial", "evidence", "victim",
    "accused", "theft", "murder", "assault", "cheating", "fraud", "rape",
    "dowry", "defamation", "kidnapping", "robbery", "hurt", "harassment",
    "gazette", "procedure", "cognizable", "non-cognizable",
    "killed", "stole", "stolen", "injured", "hit", "beaten", "threatened",
    "bribe", "fake", "forged", "scam", "abuse", "abused", "extortion"
}

OUT_OF_DOMAIN_PATTERNS = [
    r"\bhow\s+to\s+cook\b",
    r"\brecipe\b",
    r"\bmake\s+(tea|coffee|cake|pizza|biryani|food)\b",
    r"\bmovie\b",
    r"\bsong\b",
    r"\bweather\b",
    r"\bcricket\s+score\b",
]

def is_legal_query(question: str) -> bool:
    normalized = question.lower()
    if any(re.search(pattern, normalized) for pattern in OUT_OF_DOMAIN_PATTERNS):
        return False

    # Check for just numbers (like "420" or "302")
    if re.fullmatch(r"\d+[a-zA-Z-]*", normalized.strip()):
        return True

    words = set(re.findall(r"[a-zA-Z-]+", normalized))
    if words & LEGAL_TERMS:
        return True

    if re.search(r"\b(?:section|sec\.?)\s*\d+[a-zA-Z-]?\b", normalized):
        return True

    # If it has more than 5 words, assume it's a description of an incident
    if len(words) > 5:
        return True

    return False
