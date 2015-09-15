var acquire = require('acquire'),
  bodyParser = require('body-parser'),
  compression = require('compression'),
  config = acquire('config'),
  events = require('events'),
  express = require('express'),
  http = require('http'),
  net = require('net'),
  spawn = require('child_process').spawn,
  sugar = require('sugar'),
  timers = require('timers'),
  utilities = acquire('utilities'),
  os = require('os'),
  Logger = acquire('logger');

var logger = null;

var PHANTOM_COMMAND = 'phantomjs',
  SLIMER_COMMAND = 'submodules/slimerjs/src/slimerjs';

if (os.platform().indexOf('win') === 0) {
  SLIMER_COMMAND = 'submodules\\slimerjs\\src\\slimerjs.bat';
}

// TODO
// Summoner should be moved to his own file.
var Summoner = module.exports = function (engine, ip, port, callback) {
  this.init(engine, ip, port, callback);
};

Summoner.prototype = new events.EventEmitter();

Summoner.prototype.init = function (engine, ip, port, callback) {
  logger = new Logger(false);
  logger.info(ip + ':' + port);
  var self = this;
  self._summonVerified = false;
  self.id = port;
  self._ip = ip;
  self._port = port;
  self._callback = callback;
  self._tab = null;
  self._date = Date.create('today');
  logger.info('Summoning Tab');
  var command = engine === 'webkit' ? PHANTOM_COMMAND : SLIMER_COMMAND;
  self._tab = spawn(command, ['submodules/boar/tab.js', ip, port, config.HUB_PORT]);

  self._noSpawnTimer = timers.setTimeout(function () {
    self._onNoSpawn();
  }, 10000);
  self._tab.stdout.on('data', function (data) {
    logger.info('stdout: ' + data);
  });
  self._tab.stderr.on('data', function (data) {
    logger.info('stderr: ' + data);
  });
};

Summoner.prototype._kill = function () {
  var self = this;
  logger.info('killing tab on port ' + self.id);
  self._tab.kill();
  self.emit('exit');
};

Summoner.prototype.release = function () {
  var self = this;
  self._callback({
    url: 'http://' + self._ip + ':' + this.id
  });
  self._monitor();
};

Summoner.prototype._onNoSpawn = function () {
  var self = this;
  self._callback({
    url: null
  });
  self._kill();
};

Summoner.prototype._monitor = function () {
  var self = this;
  timers.clearTimeout(self._noSpawnTimer);
  logger.info('Tab: ' + self.id + ' is alive.');
  var uri = 'http://' + self._ip + ':' + self.id + '/ping';
  logger.info(uri);
  var request = http.get(uri, function () {
      self._monitor();
    })
    .on('error', function () {
      self._kill();
    });
  request.setTimeout(10000, function () {
    self._kill();
  });
};
