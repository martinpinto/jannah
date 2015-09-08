var acquire = require('acquire'),
  bodyParser = require('body-parser'),
  compression = require('compression'),
  config = acquire('config'),
  express = require('express'),
  http = require('http'),
  io = require('socket.io'),
  Papertrail = require('winston-papertrail').Papertrail,
  util = require('util'),
  sugar = require('sugar'),
  program = require('commander'),
  pjson = acquire('package'),
  Logger = acquire('logger');

var logger = null;


var Master = function() {
  this._debug = program.debug;
  program.version(pjson.version);

  this._hub = {};
  this._server = null;
  this._backChannel = null;
  this.init();
};

Master.prototype.init = function() {
  var self = this;
  logger = new Logger(self.debug);
  self._backChannel = new io();
  self._backChannel.on('connection', self._onConnect.bind(self));
  self._backChannel.listen(config.MASTER_BACK_CHANNEL_PORT);
  var app = express();
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.all('*', function(req, res) {
    self._handleRequest(req, res);
  });
  app.listen(config.MASTER_PORT);
  logger.info('Master started');
};

Master.prototype._handleRequest = function(req, res) {
  var self = this;
  var url = req.url;
  var body = req.body;

  var callback = function(data) {
    res.statusCode = 200;
    res.write(JSON.stringify(data));
    res.end();
  };

  var parts = url.split('/');
  var action = parts.last();
  logger.info('------- Requested -------');
  logger.info(url);
  logger.info(body);
  logger.info('parts ' + parts.toString());
  logger.info('--------------------------');

  switch (action) {
    case 'new':
      var country = null,
        city = null;

      if (parts.length === 3) {
        country = parts[0];
        city = parts[1];
      } else if (body && Object.has(body, 'country')) {
        country = body.country;
        city = body.city;
      }

      var hub = self._delegate(country, city);

      if (!hub) {
        logger.warn('New request for a Tab failed because Master doesn\'t think any are available!');
        callback(Object.merge({
            'status': 'There doesn\'t seem to be any hubs available'
          },
          self._hub));
        break;
      }
      hub.ip = self._debug ? config.DEFAULT_IP : hub.ip;
      var hubUrl = 'http://' + hub.ip + ':' + parseInt(config.HUB_PORT) + '/new';
      logger.info('New request for an Tab - redirect to ' + hubUrl);
      res.redirect(307, hubUrl);
      break;
    case 'health':
      callback(self._locationBasedView(false));
      break;
    case 'locations':
      callback(self._locationBasedView(true));
      break;
    default:
      callback('What was that? Didn\'t recognize your call.');
      break;
  }
};

Master.prototype._locationBasedView = function(forPublicView) {
  var self = this;
  var formatted = {};

  Object.values(self._hub, function(hub) {
    var location = hub.location;
    if (!Object.has(formatted, location.country.toLowerCase()))
      formatted[location.country.toLowerCase()] = [];
    var newRequest = '/' + location.country.toLowerCase() + '/' + location.city.toLowerCase() + '/new';
    formatted[location.country.toLowerCase()].push({
      city: location.city.toLowerCase(),
      path: newRequest,
      health: hub.health,
      availableTabs: hub.maxTabs - hub.activeTabs
    });
  });

  if (forPublicView)
    formatted = Object.reject(formatted, 'health');

  return JSON.stringify(formatted);
};

Master.prototype._delegate = function(country, city) {
  var self = this;
  var notFound = true;
  var ignore = [];
  var theChosenOne = null;
  logger.info('delegate ' + country + city);
  while (notFound) {
    var hub = self._mostIdleHub(country, city, ignore);
    if (!hub)
      break;
    // high io will cause high load avg put not mem issues
    // often points to browser issues, watch this first.
    if (hub.health.loadavg.average() > 4) {
      ignore.push(hub.ip);
      continue;
    }
    // check for mem issues
    // check for high cpu
    theChosenOne = hub;
    notFound = false;
  }

  logger.info('delegate found ' + JSON.stringify(theChosenOne));

  return theChosenOne;
};

// Finds a hub which has the least number of active Tabs going on.
Master.prototype._mostIdleHub = function(country, city, ignore) {
  var self = this;
  var hub = Object.values(self._hub);

  hub = hub.filter(function(hub) {
    if (!country) // we don't care about location here.
      return true;

    if (ignore.some(hub.ip))
      return false;

    if (hub.location.country === country && (hub.location.city === city || !city))
      return true;
    else
      return false;
  });

  return hub.max(function(hub) {
    return hub.maxTabs - hub.activeTabs;
  });
};

Master.prototype._onConnect = function(socket) {
  var self = this;
  socket.on('disconnect', self._onDisconnect.bind(self, socket));
  socket.on('HubUpdate', self._onHubUpdate.bind(self, socket));
};

Master.prototype._onHubUpdate = function(socket, status) {
  var self = this;
  logger.info('StatusUpdate : ' + socket.id + ', status : ' + JSON.stringify(status));
  self._hub[socket.id] = status;
};

Master.prototype._onDisconnect = function(socket, err) {
  var self = this;
  var hub = Object.has(self._hub, socket.id) ? self._hub[socket.id] : null;

  if (err) {
    logger.warn('A Hub went down, and we had an error - Hub - ' + JSON.stringify(hub) + '\n err ' + err);
  } else if (hub && !err) {
    logger.error('A Hub went down ' + JSON.stringify(hub));
    self._hub = Object.reject(self._hub, socket.id);
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

  new Master();
}

main();
