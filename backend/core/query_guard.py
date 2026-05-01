import re


LEGAL_TERMS = {
    "ipc",
    "bns",
    "bnss",
    "crpc",
    "fir",
    "bail",
    "court",
    "crime",
    "criminal",
    "offence",
    "offense",
    "punishment",
    "section",
    "act",
    "law",
    "legal",
    "police",
    "arrest",
    "complaint",
    "charge",
    "trial",
    "evidence",
    "victim",
    "accused",
    "theft",
    "murder",
    "assault",
    "cheating",
    "fraud",
    "rape",
    "dowry",
    "defamation",
    "kidnapping",
    "robbery",
    "hurt",
    "harassment",
    "gazette",
    "procedure",
    "cognizable",
    "non-cognizable",
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

    words = set(re.findall(r"[a-zA-Z-]+", normalized))
    if words & LEGAL_TERMS:
        return True

    if re.search(r"\b(?:section|sec\.?)\s*\d+[a-zA-Z-]?\b", normalized):
        return True

    return False
