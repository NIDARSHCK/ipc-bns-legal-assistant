import os
import httpx
import json
from textwrap import dedent
from typing import Optional

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

INTENT_SYSTEM_PROMPT = dedent(
    """
    You are an Indian Legal NLP router.
    Classify the user's intent into one of these EXACT categories:
    - greeting (for hi, hello, who are you)
    - legal_question (for general offenses, punishments, IPC/BNS sections)
    - legal_situation (for "someone hit my car", "my neighbor is threatening me", "accident")
    - comparison (explicitly asking to map, compare, or transition between IPC and BNS. e.g. "BNS equivalent of IPC 302", "What replaced IPC 378?", "How has theft changed from IPC to BNS?")
    - summarization (asking to summarize a law)
    - general_information (general questions about the assistant)
    - unsupported (non-legal questions like "how to cook")
    
    If it is a legal_question, legal_situation, or comparison, generate an "optimized_query" containing 4-8 highly relevant keywords.
    
    For ANY query mentioning a specific Act (IPC or BNS) and/or section, extract them into source_act and source_section.
    (e.g., "IPC Section 420" -> source_act: "IPC", source_section: "420")
    (e.g., "BNS 103" -> source_act: "BNS", source_section: "103")
    (e.g., "section 420" -> source_act: null, source_section: "420")
    
    If intent is "comparison", you MUST identify the target Act as well.
    (e.g., "BNS equivalent of IPC 302" -> source_act: "IPC", source_section: "302", target_act: "BNS")
    (e.g., "How has theft changed from IPC to BNS?" -> source_act: null, source_section: null, target_act: null, optimized_query: "theft IPC BNS transition")
    
    Return ONLY a JSON object with this exact schema:
    {
        "intent": "string",
        "optimized_query": "string (or null)",
        "source_act": "string (IPC or BNS, or null)",
        "source_section": "string (e.g. '302', or null)",
        "target_act": "string (IPC or BNS, or null)"
    }
    """
).strip()


LEGAL_ANSWER_SYSTEM_PROMPT = dedent(
    """
    You are a premium Indian legal information assistant for the IPC to BNS transition.
    You are working only from retrieved authoritative legal evidence.
    Provide a CLEAN, CRISP, AND PROFESSIONAL EXECUTIVE SUMMARY format.
    
    Answer ONLY from the retrieved context and conversation history. 
    If the context is insufficient, say EXACTLY: "I couldn't find a sufficiently relevant source in the available legal documents."
    NEVER invent section numbers, punishments, Gazette pages, case law, or citations.
    Every legal claim must be supported by retrieved evidence.
    
    FORMATTING RULES:
    1. Direct Answer: Provide a crisp 1-2 sentence executive summary of the law.
    2. What It Means: Use bullet points (-) for key takeaways and clauses. Avoid huge walls of text.
    3. How It Relates: Directly link the law to the user's situation in clear language.
    4. Important Notes: Highlight exceptions clearly.
    
    Return ONLY a JSON object with this exact schema:
    {
        "answer": {
            "direct_answer": "Crisp executive summary (1-2 sentences).",
            "relevant_law": "Act, Section, Title.",
            "what_it_means": "Detailed Explanation (use bullet points if needed).",
            "clauses": {"clause_name": "crisp explanation"},
            "how_it_relates": "Direct connection to the user's facts.",
            "punishment": "Clear consequences if explicitly supported.",
            "important_notes": "Exceptions or conditions.",
            "related_provisions": "Any genuinely relevant other provisions."
        },
        "comparison": null  
    }
    
    DO NOT use markdown like ** or ### in the JSON values, but you CAN use '-' for bullet points.
    
    If comparison is set or explicitly asked for, use this schema:
    "comparison": {
        "ipc": {"section": "number", "offence": "...", "punishment": "... (or null)"},
        "bns": {"section": "number", "offence": "...", "punishment": "... (or null)"},
        "summary": "A crisp explanation of what changed between IPC and BNS for this offence."
    }
    """
).strip()


async def analyze_query_intent(question: str, conversation: Optional[list[dict]] = None) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is missing in backend/.env")
        
    history_context = format_conversation_context(conversation or [])
    
    prompt = f"Previous Context:\n{history_context if history_context else 'None'}\n\nCurrent Question:\n{question}"
        
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
                    {"role": "system", "content": INTENT_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
            },
        )
        if response.status_code != 200:
            return {"intent": "legal_question", "optimized_query": question}
        try:
            return json.loads(response.json()["choices"][0]["message"]["content"])
        except Exception:
            return {"intent": "legal_question", "optimized_query": question}


def format_conversation_context(conversation: list[dict]) -> str:
    """
    Format previous conversation turns into a string for the LLM.
    Limits to the last 5 turns to prevent context bloat.
    """
    if not conversation:
        return ""
        
    recent_context = conversation[-5:]
    formatted = []
    
    for msg in recent_context:
        role = msg.get("role", "user").capitalize()
        content = msg.get("content", "")
        formatted.append(f"{role}:\n{content}")
        
    return "\n\n".join(formatted)


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
    conversation: Optional[list[dict]] = None
) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is missing in backend/.env")

    legal_context = _format_context(retrieved_chunks)
    history_context = format_conversation_context(conversation or [])
    
    user_prompt = dedent(
        f"""
        Incident date: {incident_date}
        Applicable legal era: {legal_era}
        
        Previous Conversation Context:
        {history_context if history_context else "None"}
        
        Retrieved Legal Documents:
        {legal_context}
        
        Current Question:
        {question}
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
                    {"role": "system", "content": LEGAL_ANSWER_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
            },
        )
        response.raise_for_status()
        data = response.json()
        try:
            return json.loads(data["choices"][0]["message"]["content"])
        except Exception:
            return {"answer": data["choices"][0]["message"]["content"], "comparison": None}


COMPARISON_SYSTEM_PROMPT = dedent(
    """
    You are an expert Indian Legal Mapping AI evaluating the transition between the Indian Penal Code (IPC) and Bharatiya Nyaya Sanhita (BNS).
    
    You will be provided with:
    1. A SOURCE Section (the old or new law queried).
    2. Multiple TARGET Candidates retrieved semantically from the opposite Act.
    
    Your task is to critically evaluate the actual legal text of the Source against the Candidates and determine the true substantive equivalent.
    Do NOT blindly select a candidate just because the section number is similar.
    Do NOT blindly select the first candidate.
    Read the legal provisions carefully.
    
    Allowed relationships:
    - "Exact/Direct Correspondence"
    - "Substantially Corresponding"
    - "Modified Provision"
    - "Related Provision"
    - "No Reliable Correspondence Found"
    
    If none of the candidates meaningfully correspond, use "No Reliable Correspondence Found" and explain why.
    
    Return ONLY a JSON object with this exact schema:
    {
      "answer": {
        "direct_answer": "Crisp 1-2 sentence executive summary of the mapping.",
        "relevant_law": "State both the Source and Target provisions.",
        "what_it_means": "Explain the relationship clearly in bullet points (-).",
        "how_it_relates": "Direct connection to the user's facts (if any)."
      },
      "comparison": {
        "source_act": "IPC or BNS",
        "source_section": "section number",
        "source_title": "title of source",
        "target_act": "IPC or BNS",
        "target_section": "section number (or null if none found)",
        "target_title": "title of target (or null if none found)",
        "relationship": "One of the allowed relationships",
        "summary": "Crisp explanation of what changed or if it was retained exactly.",
        "changes": "Key differences, additions, or omissions."
      }
    }
    """
).strip()

async def build_comparison_answer(
    question: str,
    source_res: dict,
    target_candidates: list[dict],
    conversation: list[dict] = None
) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is missing in backend/.env")

    history_context = format_conversation_context(conversation or [])
    
    source_context = f"Source Act: {source_res.get('act')}\nSource Section: {source_res.get('section')}\nTitle: {source_res.get('title')}\nText: {source_res.get('text')}"
    
    candidates_context = ""
    for i, c in enumerate(target_candidates, 1):
        candidates_context += f"\n\n--- Candidate {i} ---\nAct: {c.get('act')}\nSection: {c.get('section')}\nTitle: {c.get('title')}\nScore: {c.get('score')}\nText: {c.get('text')}"
    
    user_prompt = dedent(
        f"""
        Previous Conversation Context:
        {history_context if history_context else 'None'}
        
        Current Question:
        {question}
        
        --- SOURCE PROVISION ---
        {source_context}
        
        --- TARGET CANDIDATES ---
        {candidates_context}
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
                    {"role": "system", "content": COMPARISON_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
            },
        )
        response.raise_for_status()
        data = response.json()
        try:
            return json.loads(data["choices"][0]["message"]["content"])
        except Exception:
            return {"answer": {"direct_answer": data["choices"][0]["message"]["content"]}, "comparison": None}

