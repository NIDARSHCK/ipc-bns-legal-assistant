import urllib.request
import urllib.error
import json

req = urllib.request.Request(
    'https://ipc-bns-legal-assistant.onrender.com/chat',
    data=json.dumps({'question': 'snaching', 'incident_date': '2024-08-01'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    response = urllib.request.urlopen(req)
    print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print('ERROR BODY:', e.read().decode('utf-8'))
