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
  osm = require('os-monitor'),
  program = require('commander'),
  pjson = acquire('package'),
  Logger = acquire('logger');

var logger = null;

var Hub = module.exports = function(args) {
  this._tabs = {};
  this._debug = program.debug;
  this._backChannel = null;
  this._health = {};
  this._ip = '';
  this._maxTabs = 0;
  this._reservedPorts = [];
  this._location = {};
  this.init();
};

Hub.prototype.init = function() {
  var self = this;

  var app = express();
  logger = new Logger(self._debug);
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.all('*', function(req, res) {
    self._handleRequest(req, res);
  });
  app.listen(config.HUB_PORT);
  logger.info('Initializing Hub');
  self._openBackChannel(function(err) {
    if (err) logger.info(err);
  });
};

Hub.prototype._exit = function(err) {
  var self = this;
  if (err)
    console.warn('Hub is going down because of an error ' + err);
  else
    logger.info('Hub exited cleanly ...');
  self._backChannel.emit('disconnect', err);
};

Hub.prototype._openBackChannel = function(done) {
  var self = this;
  var hub = require(config.HUB_CONFIG_PATH);
  self._maxTabs = hub.maxTabs;
  self._location = hub.location;
  new Seq()
    .seq(function() {
      if (!self._debug)
        utilities.getNetworkIP(this);
      else
        this(null, {
          ip: config.DEFAULT_IP
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
      logger.info('Hub up and going');
    })
    .catch(function(err) {
      done(err);
    });
};

Hub.prototype._monitorHealth = function(done) {
  var self = this;
  logger.info('Checking hub health');
  osm.start();
  osm.on('monitor', function(event) {
    self._health = Object.reject(event, 'type');
  });
  done();
};

Hub.prototype._talkToMaster = function(done) {
  var self = this;
  logger.info('Registering with Hub');
  // Establish the back channel to Master !
  var socketOptions = {
    transports: ['websocket']
  };

  var masterIp = self._debug ? config.DEFAULT_IP : config.MASTER_ADDRESS;
  self._backChannel = io.connect('http://' + masterIp + ':' + config.MASTER_BACK_CHANNEL_PORT,
    socketOptions);

  self._backChannel.on('connect_error', function(err) {
    logger.info('BackChannel Error received : ' + err);
    done(err);
  });

  self._backChannel.on('connect', function() {
    logger.info('BackChannel open and ready for use');
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
    logger.info('Got free port', port);
    if (port === null)
      return callback({
        url: null
      });

    var onExit = function() {
      logger.info('Purging :' + port);
      self._tabs[port].removeAllListeners(['exit']);
      delete self._tabs[port];
      self._reservedPorts.splice(self._reservedPorts.indexOf(self.id), 1);
      self._sendUpdateToMaster();
    };

    self._reservedPorts.push(port);
    var ip = self._debug ? config.DEFAULT_IP : self._ip;

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
  logger.info(data.port);
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
    case '/new':
      self._new(data, callback);
      break;
    case '/announceTab':
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

  var args = process.argv;

  program.version(pjson.version)
    .option('-d, --debug', 'Runs in debug mode')
    .parse(args);

  new Hub(args);
}

main();
