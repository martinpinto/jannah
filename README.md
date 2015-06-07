# Quick API Reference

## API summary

We provide a very simple API:

* Get tab from desired location
* Perform Actions on tab.


## More detailed

* $HUB_URL / new:
  - input:
      - (optional) country: Two letter representation of the country, such as DE, US, UK or NL
      - (optional) city: lower-cased city name
  - returns:
      - url: a url ($URL) of a provisioned tab for the requested location, all other calls will be done against this url.


* $URL / open:
  - input:
      - url: a url to open
  - returns:
      - success: boolean (true/false) if opening the url was successful 
      - elapsedTime: Time it took to complete the operation
      

* $URL / addCookie:
  - input:
      - name: the name of the cookie (string)
      - value: the value of the cookie (string)
      - domain: the domain name on which the cookie is attached
      - path: the path in URLs on which the cookie is valid
      - httponly: true if the cookie should only be sent to, and can only be modified by, an HTTP connection.
      - secure: true if the cookie should only be sent over a secure connection.
      - expires: Holds the expiration date, in milliseconds since the epoch. This property should be null for cookies existing only during a session.
  - returns:
      - success: boolean (true/false) if adding the cookie was successful 


* $URL / setUserAgent:
  - input:
      - userAgent: the value of the userAgent (string)
  - returns:
      - success: boolean (true/false) if setting the user-agent was successful


* $URL / getResources:
  - returns:
      - resources: a dict with all resources loaded
      - success: boolean (true/false) if fetching the resources was successful 


* $URL / getScreenshot:
  - returns:
      - data: a base64 string representation of the rendered page
      - success: boolean (true/false) if taking a screenshot was successful
    

* $URL / evaluate:
  - input:
      - script: a javascript function to be executed on the DOM with optional primitive return value
  - returns:
      - script: the executed javascript function (string)
      - result: result of the executed javascript function
      

* $URL / evaluateOnGecko:
  - input:
      - script: a javascript function to be executed on the Gecko engine with optional primitive return value
  - returns:
      - script: the executed javascript function (string)
      - result: result of the executed javascript function


* $URL / getConsoleLog:
  - returns:
      - consoleLog: a list of logs in form of {msg: msg, lineNum: lineNum, sourceId: sourceId}
   
   
* $URL / destroy:
  - returns:
      - success: boolean (true/false) if opening the url was successful


* $URL / getCookies:
  - returns:
      - cookies: a list of cookies

# Local testing and development

## Install

1. Clone this project (or your own fork of it, if you want to create pull requests)
2. Before you run it, open a terminal window and go to the folder this project is in. Run the command “git submodule update —init —recursive” to pull the slimerjs dependency 
3. Now run “npm install” to get the required Node.js modules

## Local use

SlimerJS can use an environment variable to determine the exact Firefox binary to use. You may want to set SLIMERJS_LAUNCHER and point to a specific Firefox.exe or xulrunner instance. If SlimerJS fails to find Firefox automatically on your system, you *must* set this variable before you'll be able to run the next commands.

1. Run ```node master.js debug```
2. Open a new terminal window, run ```node hub.js debug```.

You can now run (from a third terminal window) code that sends commands to the server. See scripts in the https://github.com/Asynchq/jannah/tree/master/examples folder for examples.
