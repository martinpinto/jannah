"use strict";

let net = require('net'),
  Utilities = module.exports;

Utilities.getFreePort = function (reservedPorts, tabPorts, callback) {
  let i = -1,
    availablePorts = tabPorts.filter((port) => {
      return !reservedPorts.has(port);
    });

  let _isPortFree = function (port, callback) {
    let client = new net.Socket();
    client.on('error', function () {
      client.destroy();
      callback(true);
    });

    client.connect(port, 'localhost', function () {
      client.destroy();
      callback(false);
    });
  };

  let findFreePort = function (isFree) {
    if (isFree) {
      callback(availablePorts[i]);
    } else {
      i += 1;
      if (availablePorts[i] === undefined) {
        callback(null);
        return;
      }
      _isPortFree(tabPorts[i], findFreePort);
    }
  };
  findFreePort(false);
};

Utilities.getNetworkIP = function (callback) {
  let ip = require('whatismyip'),
    options = {
      url: 'http://checkip.dyndns.org/',
      truncate: '',
      timeout: 60000,
      matchIndex: 0
    };

  ip.whatismyip(options, callback);
};
