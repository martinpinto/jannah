"use strict";

let osm = require('os-monitor'),
  sugar = require('sugar'),
  logger = new (require('../common/logger'))(global.DEBUG);

function Backchannel(masterLocation, hubDetails, sendInterval, tabList) {
  this._health = {};
  this._masterLocation = masterLocation;
  this._sendIntervalTime = sendInterval;
  this._hubDetails = hubDetails;

  this._connected = false;
  this._sendInterval = null;
  this._socket = null;
  this._sendInterval = null;

  this._tabList = tabList;

  this._setupMonitorHealth();
  tabList.on('tabChanges', this._sendUpdate.bind(this));
}

Backchannel.prototype._setupMonitorHealth = function() {
  let self = this;

  osm.start();
  osm.on('monitor', (osEvent) => {
    self._health = Object.reject(osEvent, 'type');
  });
};

/**
 * Connects to master socket server, can be done once
 * rest server is listening
 */
Backchannel.prototype.connect = function() {
  let self = this;

  this._socket = require('socket.io-client').connect(this._masterLocation, {
    transports : ['websocket']
  });

  this._socket.on('connect_error', (error) => {
    logger.error('Backchannel failed to connect to master', {
      error : error.message
    });
  });

  this._socket.once('connect', () => {
    logger.info('Backchannel connected');
    self._connected = true;
    self._sendUpdate(); //_sendUpdate has side effects, if there would be
    self._setupSendLoop();
  });

  this._socket.once('disconnect', this._handleDisconnect.bind(this));
};

Backchannel.prototype._setupSendLoop = function() {
  this._sendInterval = setInterval(this._sendUpdate.bind(this),
    this._sendIntervalTime);
};

/**
 * Sends update to master
 *
 * Could be called from outside, for example,
 * if tab list changes
 */
Backchannel.prototype._sendUpdate = function() {
  if(!this._connected) {
    logger.info('Tried to send update while disconnected');
    return;
  }

  this._socket.emit('HubUpdate', {
    health     : this._health,
    ip         : this._hubDetails.ip,
    port       : this._hubDetails.port,
    maxTabs    : this._hubDetails.maxTabs,
    location   : this._hubDetails.location,
    activeTabs : this._tabList.size(),
  });

  //send update could be called out of order
  //to minimize amount of traffic send interval
  //can be reset
  if(this._sendInterval !== null) {
    clearInterval(this._sendInterval);
    this._sendInterval = null;
    this._setupSendLoop();
  }
};

/**
 * When socket disconnects happens for some reason it is required that it
 * tries to connect to master again, there might be active tabs etc. they
 * should not be affected by this
 */
Backchannel.prototype._handleDisconnect = function() {
  logger.info('Backchannel socket disconnected');

  if(this._sendInterval !== null) {
    clearInterval(this._sendInterval);
    this._sendInterval = null;
  }

  this._connected = false;

  this.connect();
};

module.exports = Backchannel;
