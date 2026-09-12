import asyncio
import os
import sys
from datetime import date
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from api.chat import ask_legal_question, AskRequest

tests = [
    # Group A
    ("A1", "What is the punishment for murder?"),
    ("A2", "What is the punishment for theft?"),
    ("A3", "What is the punishment for criminal intimidation?"),
    ("A4", "What happens if someone kidnaps another person?"),
    # Group B
    ("B1", "If a person intentionally kills someone, what punishment can they face?"),
    ("B2", "If someone takes another person's property without permission, what law applies?"),
    ("B3", "If someone threatens another person with harm, is that a crime?"),
    ("B4", "If a person forces someone to go somewhere against their will, what offence could apply?"),
    # Group C
    ("C1", "A person deliberately causes the death of another person. What law may apply?"),
    ("C2", "Someone secretly takes another person's belongings and keeps them. What offence is this?"),
    ("C3", "A person threatens to hurt someone if they do not follow their demands. What legal provision may apply?"),
    ("C4", "A person causes someone's death while driving in a dangerous and reckless manner. What law could apply?"),
    # Group D
    ("D1", "What punishment can a person receive for intentionally killing someone?"),
    ("D2", "What penalty can apply if someone steals property?"),
    ("D3", "What punishment is there for threatening someone?"),
    ("D4", "What punishment applies when someone causes serious injury to another person?"),
    # Group E
    ("E1", "Someone intentionally killed another person. Which law applies?"),
    ("E2", "A person stole another person's property. Which law applies?"),
    ("E3", "Someone threatened another person with serious harm. Which law applies?"),
    ("E4", "Someone caused a death while driving recklessly. Which law applies?"),
    # Group F
    ("F1", "What is IPC Section 302?"),
    ("F2", "What is BNS Section 103?"),
    ("F3", "What is the punishment under IPC for theft?"),
    ("F4", "What is the BNS provision for theft?"),
    # Group G
    ("G1", "A person deliberately takes something that belongs to another person and keeps it."),
    ("G2", "Someone deliberately ends another person's life."),
    ("G3", "A person scares another person by saying they will seriously hurt them."),
    ("G4", "Someone takes another person away against their wishes."),
    # Group H
    ("H1", "Tell me what the law says about taking someone else's property."),
    ("H2", "Explain the legal consequences of deliberately causing someone's death."),
    ("H3", "What legal protection exists when somebody threatens to harm me?"),
    ("H4", "What happens legally when someone takes another person away without consent?")
]

async def run_tests():
    results = []

    for t_id, q in tests:
        print(f"Running {t_id}: {q}")
        req = AskRequest(
            question=q,
            incident_date=date.today(),
            forced_era=None,
            conversation=[],
            conversation_id=None
        )

        test_res = {
            "test_id": t_id,
            "query": q,
            "error": None,
        }

        try:
            res = await ask_legal_question(req, authorization=None)

            test_res.update({
                "intent": res.intent,
                "optimized_query": res.expanded_query,
                "namespaces_searched": res.namespace,
                "citations": res.citations,
                "answer_keys": list(res.answer.keys()) if isinstance(res.answer, dict) else [],
                "answer": res.answer
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            test_res["error"] = str(e)

        results.append(test_res)

    with open("backend/scripts/comprehensive_results.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    asyncio.run(run_tests())
