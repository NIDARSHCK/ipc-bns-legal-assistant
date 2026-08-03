import urllib.request
import urllib.error

def fetch(method, url, origin, preflight=False):
    req = urllib.request.Request(url, method=method)
    req.add_header('Origin', origin)
    if preflight:
        req.add_header('Access-Control-Request-Method', 'GET')
        req.add_header('Access-Control-Request-Headers', 'Authorization, Content-Type')
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(method, url, 'status', resp.status)
            for k, v in resp.headers.items():
                print(f'{k}: {v}')
    except urllib.error.HTTPError as e:
        print(method, url, 'HTTPError', e.code)
        for k, v in e.headers.items():
            print(f'{k}: {v}')
    except urllib.error.URLError as e:
        print(method, url, 'URLError', e)

if __name__ == '__main__':
    origin = 'https://ipc-bns-legal-assistant-eo29obwjb-nidarshcks-projects.vercel.app'
    for path in ['/me', '/history', '/ask']:
        url = 'https://ipc-bns-legal-assistant.onrender.com' + path
        fetch('OPTIONS', url, origin, preflight=True)
        print('---')
        fetch('GET', url, origin)
        print('---')
