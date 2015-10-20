"use strict";

require('sugar');

let utilities = require('../common/utilities'),
  util = require('util');

/**
 * Holds list of tabs and monitors their status
 *
 * Events :
 *   * tabChanges - emitted when tab list changes(tab added or removed)
 */
function TabList(tabPortRange) {
  TabList.super_.call(this);
  this._list = new Map();
  this._usedPorts = new Set();
  this._released = new Set();
  this._tabPortRange = Number.range(tabPortRange[0], tabPortRange[1]).every();

  this._findingPort = false;
  this._findPortQueue = [];
}

util.inherits(TabList, require('events').EventEmitter);

/**
 * Finds next free port to be used by tab
 *
 * Access to port list must be serialized,
 * if concurrent access is happening then more
 * than one tab could get same port
 *
 * If few requests are made in quick time then
 * first getPort call might not have yet completed
 * and when next call is done it will naturally try
 * to use smallest port which by that moment hasn't
 * been yet reserved by previous getPort call
 *
 * @param  {Function} callback
 */
TabList.prototype.getPort = function(callback) {
  let self = this;

  if(this._findingPort === true) {
    return this._findPortQueue.push(callback);
  }

  this._findingPort = true;

  utilities.getFreePort(this._usedPorts, this._tabPortRange, (port) => {
    self._findingPort = false;
    callback(port);

    //summoner is called in callback, it will add
    //tab to the list, at that moment it is safe to request
    //next port, that call is synchronous
    process.nextTick(() => {
      if(self._findPortQueue.length > 0) {
        self.getPort(self._findPortQueue.shift());
      }
    });
  });
};

/**
 * Adds new tab to internal list, at the same time
 * it will also add exit event listener to tab
 *
 * This way there is single place where listeners are
 * added, caller just creates tab and that all
 *
 * @param {Number}   port
 * @param {Summoner} tab
 */
TabList.prototype.add = function(port, tab) {
  let self = this;

  this._list.set(port, tab);
  this._usedPorts.add(port);

  tab.on('exit', () => {
    self.remove(port);
  });

  self.emit('tabChanges');
};

TabList.prototype.remove = function(port) {
  this._list.delete(port);
  this._usedPorts.delete(port);
  this._released.delete(port);

  this.emit('tabChanges');
};

/**
 * Release call comes from boar when it has started the tab
 *
 * Process is request new tab -> tab gets created and added to the
 * list -> tab is looked up and release is called -> release calls
 * initiall callback and returns url to requester
 *
 * @param  {Number} port
 */
TabList.prototype.release = function(port) {
  if(!this._list.has(port) || this._released.has(port)) {
    return;
  }

  this._list.get(port).release();
  this._released.add(port);
};

TabList.prototype.size = function() {
  return this._list.size;
};

module.exports = TabList;
