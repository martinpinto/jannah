"use strict";

/*
The master at start up needs to bring a socketio server.
This is used to communicate between master and hubs. Note the hubs are where the BOAR instances are run from
and are therefore need monitoring.

When a hub is launched it will attempt to register with the master via this back channel.
This channel is used for status updates that the hub needs to regularly report. The master can then use this information
to determine Hub(VM) health, how busy each hub is, what country and city the hub is in.

The master exposes a RESTful API to the client (user) that
- Allows the user to request a new tab.
  Optionally the user should be allowed to specify the following
  * A user-agent (to be used by the browser) for each request.
  * A target screensize for the browser tab.
  * Which backend to use for (phantom or slimer i.e. webkit or gecko)
  * adblock : true or false

  It nees to be optional that the user can request a tab in a given city. For now let's go off the
  location that Digital Ocean supports (i.e. just use the same string identifier DO uses).
  Unless we are to host our own hardware then we are dependent on our cloud provider
  For first launch we are going to up on digital ocean, no point in building some sort of generic translation engine,
  Just use the DO identifiers.
*/

module.exports = (config) => {
  let hubRegistry = new (require('./hubRegistry'))(),
    socketServer = new (require('./socketServer'))(hubRegistry),
    restServer = new (require('./restServer'))(hubRegistry),
    logger = new (require('../common/logger'))(global.DEBUG);

  logger.info('Starting servers', {
    restPort        : config.restPort,
    backchannelPort : config.backchannel
  });

  socketServer.listen(config.backchannel);
  restServer.listen(config.restPort);
};
