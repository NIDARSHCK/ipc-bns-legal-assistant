import sys
from pathlib import Path
import json

sys.path.append(str(Path(__file__).resolve().parent.parent))
from core.vector_db import search_legal_corpus

def run_tests():
    queries = [
        'Explain IPC Section 279.',
        'Explain IPC 302.',
        'IPC Section 320',
        'What does IPC 279 say?',
        'Explain BNS Section 281.',
        'What does BNS 281 say?',
        'What is the punishment for rash driving?',
        'If a person drives a vehicle recklessly on a public road and puts the lives or safety of other people at risk, what legal consequences or punishment can apply under Indian penal law?',
        'Suppose someone is driving very fast and carelessly on a public road and causes danger to other people. What offence can this amount to and what punishment is provided by law?',
        'Under the IPC, what law deals with rash driving on a public road?',
        'Under the BNS, what provision deals with rash or negligent driving?',
        'What happens if someone drives carelessly and endangers people on the road?',
        'What offence applies when a driver behaves recklessly on a public road?',
        'I want to understand the law regarding a situation where a person is driving a car on a public road in a reckless and negligent manner without considering the safety of pedestrians and other road users. If the driving creates a danger to human life or is likely to cause injury to another person, what offence does the law recognize, what punishment can be imposed, and which legal provision should I refer to?',
        'What is the punishment for theft?',
        'What happens legally if a person intentionally takes another person\'s property without their consent?',
        'If someone takes another person\'s property dishonestly without permission, what offence could this constitute?',
        'What law deals with kidnapping?',
        'If a person takes someone away against their will, what legal provision may apply?',
        'What is the punishment for murder under Indian penal law?',
        'What legal provision deals with causing grievous hurt?',
        'What happens if someone threatens another person with serious harm?',
        'Under the Indian Penal Code, what punishment was provided for driving rashly or negligently on a public way?',
        'According to the IPC, what offence is committed when someone drives dangerously and puts other people at risk?',
        'What is the punishment prescribed under IPC Section 279?',
        'According to the Bharatiya Nyaya Sanhita, what punishment applies to rash driving?',
        'What does the BNS say about driving a vehicle in a rash or negligent manner on a public way?',
        'What is the punishment under BNS Section 281?',
        'Explain IPC 279 in simple language and tell me the punishment.',
        'Can you explain BNS Section 281 and what punishment it provides?',
        'Explain the legal provision in Section 281 of the BNS in simple words.',
        'What is rash driving?',
        'What is reckless driving under Indian law?',
        'Is dangerous driving punishable under Indian penal law?',
        'What is the capital of India?',
        'How do I make a cup of coffee?',
        'What is the weather today?',
        'How does photosynthesis work?'
    ]
    
    out = []
    for q in queries:
        try:
            results = search_legal_corpus(q, top_k=3)
            clean_res = []
            for r in results:
                clean_res.append({
                    'act': r.get('act'),
                    'section': r.get('section'),
                    'score': round(r.get('score', 0), 4),
                    'page': r.get('page'),
                    'title': r.get('title')
                })
            out.append({'query': q, 'results': clean_res})
        except Exception as e:
            out.append({'query': q, 'error': str(e)})
            
    with open('test_results.json', 'w') as f:
        json.dump(out, f, indent=2)

if __name__ == '__main__':
    from dotenv import load_dotenv
    load_dotenv(str(Path(__file__).resolve().parent.parent / '.env'))
    run_tests()
