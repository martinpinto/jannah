"use strict";

let restify = require('restify'),
  request = require('request'),
  logger = new (require('../common/logger'))(global.DEBUG);

function RestServer(hubRegistry) {
  this._hubRegistry = hubRegistry;
  this._server = restify.createServer();
  this._server.use(restify.bodyParser());
  this._setupRoutes();
}

RestServer.prototype.listen = function(port) {
  this._server.listen(port);
};

RestServer.prototype._setupRoutes = function() {
  this._server.post('/sessions', this._postSessions.bind(this));
  this._server.get('/hubs', this._getHubs.bind(this));
  this._server.get('/health', this._getHealth.bind(this));
};

RestServer.prototype._postSessions = function(req, resp, next) {
  let hub = this._hubRegistry.find(req.body.location);

  if(hub === null) {
    logger.error('Could not select a hub', {
      location : req.body.location
    });

    return next(new restify.ServiceUnavailableError('No hubs available'));
  }

  request.post({
    url : 'http://' + hub.ip + ':' + hub.port + '/tab',
    json : true,
    body : {
      engine  : req.body.engine,
      adblock : req.body.adblock
    }
  }).pipe(resp);
};

RestServer.prototype._getHubs = function(req, resp) {
  resp.send(this._hubRegistry.asArray());
};

RestServer.prototype._getHealth = function(req, resp) {
  //@TODO implement me
};

module.exports = RestServer;
