import requests
import json


def do_command(url, command, data={}):
    print "executing %s/%s      " % (url, command),
    headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
    response = requests.post('%s/%s' % (url, command),
                             data=json.dumps(data), headers=headers)
    print response.status_code
    print response.text
    return response

# Get a tab from the Netherlands
"""
data = {'country': 'NL'}
response = do_command("http://82.196.12.25:8421", "new", data)
url = json.loads(response.text)["result"]
"""

url = "http://127.0.0.1:8080"
# Set Cookies
cookie = {"domain": ".sweatytacobo.com",
    "httponly": False,
    "name": "__utmz",
    "path": "/",
    "secure": False,
    "value": "268881515.13222266.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none)"
}

response = do_command(url, "addCookie", cookie)

"""
# Set User Agent
data = {'value': 'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) '
        + 'AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334'
        + ' Safari/7534.48.3'}
response = do_command(url, "setUserAgent", data)

# Open URL
data = {'value': 'http://ebay.de'}
response = do_command(url, "open", data)

# Get Resources
response = do_command(url, "getResources")
resources = json.loads(response.text)["result"]
resources.sort(key=lambda x: x, reverse=True)
print "\nThe Resources \n"
for resource in resources:
    print resource
print ""

# Take Screenshot
response = do_command(url, "takeScreenshot")
screenshot_url = json.loads(response.text)["result"]
print "\nThe Screenshot " + screenshot_url + "\n"

# Destroy Tab
response = do_command(url, "destroy")
"""