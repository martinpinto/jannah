import requests
import json
import sys
import time
import os

def do_command(url, command, data={}):
    print "executing %s/%s\n" % (url, command),

    headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
    response = requests.post('%s/%s' % (url, command),
                             data=json.dumps(data), headers=headers)

    print response.status_code
    print response.text.encode('utf-8').strip()

    if response.status_code == 500:
        do_command(url, "destroy")
        sys.exit(1)

    return response

engine = sys.argv[1] if len(sys.argv) > 1 else "gecko"

print "Will test with %s engine\n"%(engine)

data = {"engine": engine, "adblock" : True}
response = do_command("http://127.0.0.1:7331", "sessions", data)


# The tab url from the previous request, all upcomin requests will be sent to that url
url = json.loads(response.text)["url"]


# Set Cookies
cookie = {"domain": ".sweatytacobo.com",
    "httponly": False,
    "name": "__utmz",
    "path": "/",
    "secure": False,
    "value": "268881515.13222266.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none)"
}
response = do_command(url, "addCookie", cookie)


# Set User Agent
data = {'userAgent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:30.0) Gecko/20100101 Firefox/30.0'}
response = do_command(url, "setUserAgent", data)

# Run a gecko based Javascript, if a result is to be expected it can be found under {'result'} of the json string returned
data = {'script': 'self._page.onLoadFinished = function(){ console.log("HELP"); };'}
response = do_command(url, "evaluateOnGecko", data)

# Open URL
data = {'url': 'http://www.google.de', 'waitForResources': False}
response = do_command(url, "open", data)


data = {'timeout': 60000}
response = do_command(url, "waitForResources", data)


# Get Resources
response = do_command(url, "getResources")
resources = json.loads(response.text)["resources"]
keys = sorted(resources.keys(), key=lambda x: int(x))
print "\nThe Resources \n"
for key in keys:
    print key, json.dumps(resources[key], sort_keys=True, indent=4, separators=(',', ': '))
print ""

data = {"size": {"width": 1280, "height":400}}
response = do_command(url, "setScreenSize", data)

# Take Screenshot and return base64 string under data
response = do_command(url, "getScreenshot")
base64 = json.loads(response.text)["data"]
# Don't output in current working dir but in examples, example script might be
# called from somewhere else
output_file = os.path.join(os.path.dirname(os.path.realpath(__file__)), "imageToSave.png")
fh = open(output_file, "wb")
fh.write(base64.decode('base64'))
fh.close()
print "Screenshot stored in %s \n"%(output_file)

# Run a DOM based javascript, if a result is to be expected it can be found under {'result'} of the json string returned
data = {'script': "function(){return document.getElementsByClassName('ctr-p').length>0}"}
response = do_command(url, "evaluate", data)


response = do_command(url, "getCookies", cookie)

response = do_command(url, "getConsoleLog")


# Destroy Tab
response = do_command(url, "destroy")
