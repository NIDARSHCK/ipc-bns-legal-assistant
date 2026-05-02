from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

LEGAL_PROMPT = ChatPromptTemplate.from_template("""
You are an Indian legal assistant.

Answer ONLY using the provided legal context.

Rules:
- Never hallucinate sections
- Mention IPC/BNS correctly
- Cite relevant sections
- Mention equivalent mapped sections if available

Question:
{question}

Legal Context:
{context}
""")

OUTPUT_PARSER = StrOutputParser()