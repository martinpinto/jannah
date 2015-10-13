"use strict";

let tabList = new (require('./tabList'))(),
  restServer = new (require('./restServer'))('127.0.0.1', tabList),
  backchannel = new (require('./backchannel'))('ws://127.0.0.1:3000', {
    ip : '127.0.0.1',
    port : 8421,
    maxTabs : 5,
    location : 'localhost'
  }, 10 * 1000, tabList);

restServer.listen(8421, () => {
  backchannel.connect();
});
