"use strict";

//@TODO read proper debug value
let logger = new (require('../common/logger'))(true);

function SocketServer(hubRegistry) {
	this._hubRegistry = hubRegistry;
	this._port = null;

	this._server = require('socket.io')();
  this._server.serveClient(false); //won't serve client library

	this._server.on('connection', this._onSocketConnection.bind(this));
}

SocketServer.prototype._onSocketConnection = function(socket) {
  let self = this;

  logger.info('New socket connection from hub', {
    id : socket.id
  })

  socket.on('disconnect', () => {
    logger.info('Socket connection closed', {
      id : socket.id
    });

    self._hubRegistry.remove(socket.id);
  });

  socket.on('HubUpdate', (data) => {
    logger.info('Hub sent update', {
      id   : socket.id,
      data : data
    });

    self._hubRegistry.update(socket.id, data);
  });
};

SocketServer.prototype.listen = function(port, callback) {
	this._port = port;

  this._server.listen(port);
};

module.exports = SocketServer;