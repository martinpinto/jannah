"use strict";

/**
 * Used by master to store and latter on find hubs when
 * api call is made
 */
function HubRegistry()  {
  this._registry = new Map();
}

HubRegistry.prototype.update = function(id, data) {
  this._registry.set(id, data);
};

HubRegistry.prototype.remove = function(id) {
  this._registry.delete(id);
};

HubRegistry.prototype.find = function(location) {
  let maxCapacity = 0,
    normalizedLocation = (location || '').toLowerCase(),
    selectedHub = null;

  this._registry.forEach(hub => {
    if(location && hub.location !== location) {
      return;
    }

    if(hub.activeTabs >= hub.maxTabs) {
      return;
    }

    if(hub.maxTabs - hub.activeTabs > maxCapacity) {
      maxCapacity = hub.maxTabs - hub.activeTabs;
      selectedHub = hub;
    }
  });

  return selectedHub;
};

HubRegistry.prototype.asArray = function() {
  let r = [];

  for(let v of this._registry.values()) {
    r.push(v);
  }

  return r;
};

module.exports = HubRegistry;
