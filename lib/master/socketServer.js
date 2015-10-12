"use strict";

function SocketServer(hubRegistry) {
	this._hubRegistry = hubRegistry;
	this._port = null;

	this._server = require('socket.io')();
  this._server.serveClient(false); //won't serve client library

	this._server.on('connection', this._onSocketConnection.bind(this));
}

SocketServer.prototype._onSocketConnection = function(socket) {
  let self = this;

  socket.on('disconnect', () => {
    self._hubRegistry.remove(socket.id);
  });

  socket.on('HubUpdate', (data) => {
    self._hubRegistry.update(socket.id, data);
  });
};

SocketServer.prototype.listen = function(port, callback) {
	this._port = port;

  this._server.listen(port);
};

module.exports = SocketServer;