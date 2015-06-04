/*jshint indent: 2*/
/*jslint indent: 2, maxlen: 100*/
/*jslint node: true, indent: 2, maxlen: 100*/
"use strict";

var acquire = require('acquire'),
  bodyParser = require('body-parser'),
  compression = require('compression'),
  config = acquire('config'),
  events = require('events'),
  express = require('express'),
  http = require('http'),
  io = require('socket.io-client'),
  net = require('net'),
  Seq = require('seq'),
  spawn = require('child_process').spawn,
  sugar = require('sugar'),
  timers = require('timers'),
  utilities = acquire('utilities'),
  Summoner = acquire('summoner'),
  winston = require('winston'),
  osm = require("os-monitor");

var Hub = module.exports = function(args) {
  this._tabs = {};
  this._debug = false;

  if (args[2]) {
    this._debug = args[2] === "debug";
  }

  this._backChannel = null;
  this._health = {};
  this._ip = "";
  this._maxTabs = 0;
  this._reservedPorts = [];
  this._location = {};
  this.init();
};

Hub.prototype.init = function() {
  var self = this;

  var app = express();
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.all('*', function(req, res) {
    self._handleRequest(req, res);
  });
  app.listen(config.HUB_PORT);
  console.log("Initializing Hub");
  self._openBackChannel(function(err) {
    if (err) console.log(err);
  });
};

Hub.prototype._exit = function(err) {
  var self = this;
  if (err)
    console.warn('Hub is going down because of an error ' + err);
  else
    console.log('Hub exited cleanly ...');
  self._backChannel.emit('disconnect', err);
};

Hub.prototype._openBackChannel = function(done) {
  var self = this;
  var hub = require(config.HUB_CONFIG_PATH);
  self._maxTabs = hub.maxTabs;
  self._location = hub.location;
  new Seq()
    .seq(function() {
      if (self._debug !== true)
        utilities.getNetworkIP(this);
      else
        this(null, {
          ip: "127.0.0.1"
        });
    })
    .seq(function(data) {
      self._ip = data.ip;
      self._monitorHealth(this);
    })
    .seq(function() {
      self._talkToMaster(this);
    })
    .seq(function() {
      console.log("Hub up and going");
    })
    .catch(function(err) {
      done(err);
    });
};

Hub.prototype._monitorHealth = function(done) {
  var self = this;
  console.log("Checking hub health");
  osm.start();
  osm.on('monitor', function(event) {
    self._health = Object.reject(event, "type");
  });
  done();
};

Hub.prototype._talkToMaster = function(done) {
  var self = this;
  console.log("Registering with Hub");
  // Establish the back channel to Master !
  var socketOptions = {
    transports: ['websocket']
  };

  var masterIp = self._debug ? "127.0.0.1" : config.MASTER_ADDRESS;
  self._backChannel = io.connect('http://' + masterIp + ':' + config.MASTER_BACK_CHANNEL_PORT,
    socketOptions);

  self._backChannel.on('connect_error', function(err) {
    console.log('BackChannel Error received : ' + err);
    done(err);
  });

  self._backChannel.on('connect', function() {
    console.log('BackChannel open and ready for use');
    // Every minute send an health update to Master.
    self._sendUpdateToMaster.bind(self);
    var tenSeconds = 10 * 1000;
    setInterval(self._sendUpdateToMaster.bind(self), tenSeconds);
  });
};

Hub.prototype._sendUpdateToMaster = function() {
  var self = this;
  self._backChannel.emit('HubUpdate', {
    health: self._health,
    ip: self._ip,
    activeTabs: Object.size(self._tabs),
    maxTabs: self._maxTabs,
    location: self._location
  });
};

Hub.prototype._new = function(data, callback) {
  var self = this;
  var func = function(port) {
    console.log("GOT FREE PORT", port);
    if (port === null)
      return callback({
        url: null
      });

    var onExit = function() {
      console.log("Purging :" + port);
      self._tabs[port].removeAllListeners(['exit']);
      delete self._tabs[port];
      self._reservedPorts.splice(self._reservedPorts.indexOf(self.id), 1);
      self._sendUpdateToMaster();
    };

    self._reservedPorts.push(port);
    var ip = self._debug ? "127.0.0.1" : self._ip;

    self._tabs[port] = new Summoner(data.engine, ip, port, callback);
    self._tabs[port].on('exit', onExit);
    // fire off a new update now that we have a new Tab 
    self._sendUpdateToMaster();
  };
  utilities.getFreePort(self._reservedPorts, func);
};

Hub.prototype._announceTab = function(data, callback) {
  var self = this;
  var port = data.port;
  console.log(data.port);
  self._tabs[port].release();
  callback({});
};

Hub.prototype._handleRequest = function(req, res) {
  var self = this;
  var url = req.url;
  var data = req.body;
  var callback = function(data) {
    res.statusCode = 200;
    res.write(JSON.stringify(data));
    res.end();
  };

  switch (url) {
    case "/new":
      self._new(data, callback);
      break;
    case "/announceTab":
      self._announceTab(data, callback);
      break;
    default:
      break;
  }
};

function main() {

  process.on('SIGINT', function() {
    process.exit(1);
  });

  var done = function(err) {
    if (err) {
      console.warn(err);
      console.trace();
    }
    process.exit(err ? 1 : 0);
  };

  var args = process.argv;

  if (args[2] && args[2] === 'help') {
    console.log('Usage: node hub.js [options]\nOptions: debug\nhelp\n');
    done();
  } else
    new Hub(args);
}

main();