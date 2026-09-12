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
    
    RULES FOR optimized_query:
    - Do NOT invent, infer, or inject section numbers or Act names (e.g. "302", "378", "IPC", "BNS") unless the user EXPLICITLY mentioned that specific section or Act in their question.
    - For natural-language or scenario-based questions, use ONLY descriptive conceptual legal keywords.
      * GOOD: "intentional killing murder punishment unlawful homicide"
      * BAD: "Section 302 murder" (Do NOT infer historical IPC sections if the user did not state them)
    - If the user asks specifically about punishment or penalties (e.g., "What is the punishment for theft?"), ensure the optimized_query includes punishment-oriented terms (e.g., "theft punishment penalty imprisonment fine") so semantic search matches penalty provisions rather than pure definitions.

    For ANY query mentioning a specific Act (IPC or BNS) and/or section, extract them into source_act and source_section.
    (e.g., "IPC Section 420" -> source_act: "IPC", source_section: "420")
    (e.g., "BNS 103" -> source_act: "BNS", source_section: "103")
    (e.g., "section 420" -> source_act: null, source_section: "420")
    
    If intent is "comparison", you MUST identify the target Act as well.
    (e.g., "BNS equivalent of IPC 302" -> source_act: "IPC", source_section: "302", target_act: "BNS")
    (e.g., "How has theft changed from IPC to BNS?" -> source_act: null, source_section: null, target_act: null, optimized_query: "theft legal transition comparison")
    
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
    If the context is insufficient, return the required JSON object using the exact schema. Set answer.direct_answer EXACTLY to: "I couldn't find a sufficiently relevant source in the available legal documents." and leave all other fields empty or null.
    NEVER invent section numbers, punishments, Gazette pages, case law, or citations.
    Every legal claim must be supported by retrieved evidence.
    
    FORMATTING RULES:
    1. Direct Answer: Provide a crisp 1-2 sentence executive summary directly answering the question.
    2. Relevant Law: State the specific Act, Section number, and official Title.
    3. What It Means: Plain-language explanation for a non-lawyer (use bullet points '-').
    4. Important Elements: List the essential conditions/ingredients (actus reus, mens rea, property type, circumstances) strictly supported by retrieved text (or null).
    5. Punishment: State the exact punishment terms (imprisonment term, fine, mandatory minimums, alternative sentencing) explicitly mentioned in context (or null).
    6. Clauses / Subsections: Break down actual numbered subsections/clauses (e.g., '(1)', '(2)', Explanations) individually. NEVER invent a subsection or clause number (or null).
    7. Exceptions / Provisos: Include statutory exceptions or provisos ONLY if actually found in retrieved evidence. If none exist in the text, set to null. NEVER invent exceptions.
    8. Practical Example: Provide a clear, realistic scenario applying the legal provisions if helpful. Do NOT make unsupported legal claims. Set to null if not useful.
    9. How It Relates: Directly link the law to the user's question or facts.
    10. Important Notes: Mention legal limits, requirements (e.g. public way, consent), or transition significance (or null).
    11. Related Provisions: Mention only provisions that are genuinely relevant from the retrieved context (or null).
    
    Return ONLY a JSON object with this exact schema:
    {
        "answer": {
            "direct_answer": "Crisp executive summary directly answering the question (1-2 sentences).",
            "relevant_law": "Act, Section, Title.",
            "what_it_means": "Simple, common-person-friendly explanation (use bullet points - where helpful).",
            "important_elements": "Essential legal elements/conditions strictly supported by the retrieved text (or null).",
            "punishment": "Detailed explanation of punishment across different clauses/situations if supported by retrieved text (or null).",
            "clauses": {"subsection_or_clause_name": "crisp explanation of actual subsection"} (or null),
            "exceptions_or_provisos": "Actual statutory exceptions or provisos present in retrieved text (or null).",
            "practical_example": "A realistic, simple illustrative scenario applying the elements (or null).",
            "how_it_relates": "Direct connection to the user's inquiry or situation.",
            "important_notes": "Statutory limitations, procedural context, or legal transition notes (or null).",
            "related_provisions": "Any genuinely relevant other provisions in the retrieved context (or null)."
        },
        "comparison": null  
    }
    
    DO NOT use markdown like ** or ### in the JSON values, but you CAN use '-' for bullet points.
    """
).strip()


async def analyze_query_intent(question: str, conversation: Optional[list[dict]] = None) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
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
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
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
        "relevant_law": "State both the IPC and BNS provisions.",
        "what_it_means": "Explain the transition and relationship clearly.",
        "how_it_relates": "Direct connection to the user's inquiry."
      },
      "comparison": {
        "relationship": "One of the allowed relationships",
        "ipc": {
          "section": "IPC section number (or 'N/A')",
          "offence": "IPC provision title / offence name",
          "purpose": "Core purpose or scope of the IPC provision",
          "punishment": "Punishment prescribed under IPC (or 'N/A')",
          "clauses": "Key clauses or subsections under IPC (or 'None')",
          "exceptions": "Exceptions or provisos under IPC (or 'None')"
        },
        "bns": {
          "section": "BNS section number (or 'N/A')",
          "offence": "BNS provision title / offence name",
          "purpose": "Core purpose or scope of the BNS provision",
          "punishment": "Punishment prescribed under BNS (or 'N/A')",
          "clauses": "Key clauses or subsections under BNS (or 'None')",
          "exceptions": "Exceptions or provisos under BNS (or 'None')"
        },
        "what_stayed_the_same": "Aspects, definitions, or penalties that remain unchanged.",
        "what_changed": "Specific changes, additions, deletions, or modifications.",
        "practical_significance": "Real-world implications for citizens, FIR filing, and judicial proceedings.",
        "summary": "Crisp 1-2 sentence overall summary of the transition.",
        "source_act": "IPC or BNS",
        "source_section": "section number",
        "target_act": "IPC or BNS",
        "target_section": "section number"
      }
    }

    DO NOT use markdown formatting like ** or ### in JSON string values.
    """
).strip()


async def build_comparison_answer(
    question: str,
    source_res: dict,
    target_candidates: list[dict],
    conversation: Optional[list[dict]] = None
) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
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

