"use strict";

const ENGINES = new Set(['webkit', 'gecko']);

let restify = require('restify'),
  logger = new (require('../common/logger'))(true);

function RestServer(serverIp, tabList) {
  this._serverIp = serverIp;
  this._server = restify.createServer();
  this._server.use(restify.bodyParser());
  this._setupRoutes();

  this._tabList = tabList;
}

RestServer.prototype._setupRoutes = function() {
  this._server.post('/tab', this._postTab.bind(this));
  this._server.post('/announceTab', this._postAnnounceTab.bind(this));
};

RestServer.prototype.listen = function(port, callback) {
  this._server.listen(port);
};

RestServer.prototype._postTab = function(req, resp, next) {
  let self = this;

  if(!ENGINES.has(req.body.engine)) {
    logger.warn('Client sent invalid engine', {
      engine : req.body.engine
    });

    return next(new restify.InvalidArgumentError('Invalid engine'));
  }

  //@XXX summoner currently doesnt have an option for adblock
  if(req.body.adblock !== true && req.body.adblock !== false) {
    logger.warn('Client sent invalid value for adblock', {
      adblock : req.body.adblock,
      engine  : req.body.engine
    });

    return next(new restify.InvalidArgumentError('Invalid value for adblock flag supplied, it must be boolean'));
  }

  this._tabList.getPort(port => {
    if(port === null) {
      logger.error('Failed to acquire free port');
      return next(new restify.ServiceUnavailableError('Could not create new tab, out of ports'));
    }

    //@XXX maybe have the callback to return error and url, that way error codes
    //could be returned
    self._tabList.add(port, new (require('./summoner'))(req.body.engine, self._serverIp,
      port, resp.send.bind(resp)));
  });
};

/**
 * Used by boar to communicate back to hub
 *
 * When tab becomes operational it makes call back
 * to rest server, after that tab is operational and
 * url to the tab can be sent back to the client
 *
 * @param  {Request}  req
 * @param  {Response} resp
 */
RestServer.prototype._postAnnounceTab = function(req, resp) {
  this._tabList.release(req.body.port);
  resp.send({});
};

module.exports = RestServer;


