import os
from textwrap import dedent

import httpx
from dotenv import load_dotenv

from core.langchain_pipeline import LEGAL_PROMPT

load_dotenv()


GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


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
) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is missing in backend/.env")

    context = _format_context(retrieved_chunks)
    system_prompt = dedent(
        """
        You are a careful Indian legal information assistant for the IPC to BNS transition.
        Answer only from the retrieved context. If context is insufficient, say exactly what is missing.
        Never invent section numbers, punishments, Gazette pages, or procedures.
        Always mention whether the incident date routes the query to IPC or BNS.
        Include citations using the retrieved act, section, and Gazette page fields.
        This is educational legal information, not a substitute for an advocate.
        """
    ).strip()

    user_prompt = dedent(
        f"""
        Incident date: {incident_date}
        Applicable legal era: {legal_era}
        User question: {question}

        Retrieved context:
        {context}

        Return:
        1. Direct answer
        2. Relevant sections
        3. Practical next steps
        4. Citations
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
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
