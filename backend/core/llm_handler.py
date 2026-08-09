import os
from textwrap import dedent

import httpx
from dotenv import load_dotenv

load_dotenv()


GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


async def analyze_query_intent(question: str) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is missing in backend/.env")
        
    system_prompt = dedent(
        """
        You are an Indian Legal NLP router.
        Classify the user's intent into one of these EXACT categories:
        - greeting (for hi, hello, who are you)
        - legal_question (for general offenses, punishments, IPC/BNS sections)
        - legal_situation (for "someone hit my car", "my neighbor is threatening me", "accident")
        - comparison (explicitly asking to compare IPC and BNS)
        - summarization (asking to summarize a law)
        - general_information (general questions about the assistant)
        - unsupported (non-legal questions like "how to cook")
        
        If it is a legal_question, legal_situation, or comparison, generate an "optimized_query" containing 4-8 highly relevant keywords (e.g., "cheating deception dishonest inducement IPC BNS offence", "rash driving negligence road accident BNS") to maximize vector search retrieval.
        
        Return ONLY a JSON object with this exact schema:
        {
          "intent": "string",
          "optimized_query": "string (or null)"
        }
        """
    ).strip()

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "temperature": 0.0,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question},
                ],
            },
        )
        if response.status_code != 200:
            return {"intent": "legal_question", "optimized_query": question}
        import json
        try:
            return json.loads(response.json()["choices"][0]["message"]["content"])
        except Exception:
            return {"intent": "legal_question", "optimized_query": question}


def _format_context(chunks: list[dict]) -> str:
    if not chunks:
        return "No retrieved legal context was found."

    lines = []
    for index, chunk in enumerate(chunks, start=1):
        lines.append(
            dedent(
                f"""
                Source {index}
                Act: {chunk.get("act", "Unknown")}
                Section: {chunk.get("section", "Unknown")}
                Gazette page: {chunk.get("page", "Unknown")}
                Title: {chunk.get("title", "Untitled")}
                Text: {chunk.get("text", "")}
                """
            ).strip()
        )
    return "\n\n".join(lines)


async def build_legal_answer(
    question: str,
    incident_date: str,
    legal_era: str,
    retrieved_chunks: list[dict],
) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is missing in backend/.env")

    context = _format_context(retrieved_chunks)
    system_prompt = dedent(
        """
        You are a careful Indian legal information assistant for the IPC to BNS transition.
        Answer ONLY from the retrieved context. If the context is insufficient, say EXACTLY: "I couldn't find a sufficiently relevant source in the available legal documents."
        NEVER invent section numbers, punishments, Gazette pages, mappings, or procedures.
        Page numbers must come strictly from the retrieved metadata (e.g. source page).
        
        Return ONLY a JSON object with this exact schema:
        {
          "answer": {
             "direct_answer": "A clear, natural-language explanation of the legal situation without markdown.",
             "relevant_law": "Act, Section, Title.",
             "what_it_means": "Explanation of the provision in simple language.",
             "clauses": {"clause_name": "explanation"},
             "how_it_relates": "How the retrieved law connects to the user's facts.",
             "punishment": "Punishment details if explicitly supported.",
             "important_notes": "Exceptions or conditions.",
             "related_provisions": "Any genuinely relevant other provisions."
          },
          "comparison": null  
        }
        
        DO NOT use markdown like ** or ### in the values. Keep it clean text.
        
        If comparison is set, use this schema:
        "comparison": {
            "ipc": {"section": "number", "offence": "...", "punishment": "... (or null)"},
            "bns": {"section": "number", "offence": "...", "punishment": "... (or null)"}
        }
        """
    ).strip()

    user_prompt = dedent(
        f"""
        Incident date: {incident_date}
        Applicable legal era: {legal_era}
        User question: {question}

        Retrieved context:
        {context}
        """
    ).strip()

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "temperature": 0.1,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            },
        )
        response.raise_for_status()
        data = response.json()
        import json
        try:
            return json.loads(data["choices"][0]["message"]["content"])
        except Exception:
            return {"answer": data["choices"][0]["message"]["content"], "comparison": None}
