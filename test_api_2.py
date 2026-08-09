import urllib.request
import json

req = urllib.request.Request(
    'https://ipc-bns-legal-assistant.onrender.com/chat',
    data=json.dumps({'question': 'accident', 'incident_date': '2024-08-01'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    response = urllib.request.urlopen(req)
    print(response.read().decode('utf-8'))
except Exception as e:
    if hasattr(e, 'read'):
        print('ERROR:', e.read().decode('utf-8'))
    else:
        print('ERROR:', str(e))
