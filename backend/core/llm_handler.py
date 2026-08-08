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
        - comparison (explicitly asking to compare IPC and BNS)
        - unsupported (non-legal questions)
        
        If it is a legal_question or comparison, generate an "optimized_query" containing 4-8 highly relevant keywords (e.g., "cheating deception dishonest inducement IPC BNS offence") to maximize vector search retrieval.
        
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
        Answer only from the retrieved context. If context is insufficient, say EXACTLY: "I couldn't find a sufficiently relevant source in the available legal documents."
        Never invent section numbers, punishments, Gazette pages, or procedures.
        Always mention whether the incident date routes the query to IPC or BNS.
        
        Return ONLY a JSON object with this exact schema:
        {
          "answer": "Clear, simple explanation in markdown.",
          "comparison": null  // Set this ONLY if specifically asked to compare, or if a clear mapping exists.
        }
        
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
