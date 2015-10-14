"use strict";

module.exports = (config) => {
  let tabList = new (require('./tabList'))(config.tabPorts),
    restServer = new (require('./restServer'))(config.publicIp, tabList),
    backchannel = new (require('./backchannel'))('ws://' + config.backchannel, {
      ip : config.publicIp,
      port : config.restPort,
      maxTabs : config.maxTabs,
      location : config.location
    }, 10 * 1000, tabList),
    logger = new (require('../common/logger'))(global.DEBUG);

  logger.info('Starting up', {
    restPort    : config.restPort,
    publicIp    : config.publicIp,
    backchannel : config.backchannel,
    maxTabs     : config.maxTabs,
    location    : config.location,
    tabPorts    : config.tabPorts
  });

  restServer.listen(config.restPort, () => {
    backchannel.connect();
  });
};
