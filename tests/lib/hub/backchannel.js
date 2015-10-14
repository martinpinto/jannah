"use strict";

let Backchannel = require('../../../lib/hub/backchannel'),
  TabList = require('../../../lib/hub/tabList'),
  should = require('should'),
  mockery = require('mockery'),
  EventEmitter = require('events').EventEmitter;

describe('backchannel', () => {
  let backchannel, ioMock, socketMock, tabList;

  before(() => {
    mockery.enable({
      warnOnUnregistered : false
    });
  });

  after(() => {
    mockery.disable();
  });

  beforeEach(function() {
    tabList = new TabList([55500, 55555]);

    backchannel = new Backchannel('http://127.0.0.1:666', {
      location : 'ams1',
      port     : 777,
      ip       : '127.0.0.1',
      maxTabs  : 5
    }, 10 * 1000, tabList);

    socketMock = new EventEmitter();
    mockery.registerMock('socket.io-client', {
      connect : () => {
        return socketMock;
      }
    });
  });

  afterEach(() => {
    //otherwise node will complain about too many listeners being added
    require('os-monitor').removeAllListeners('monitor');
  });

  it('should be exported as function', () => {
    Backchannel.should.be.a.Function();
  });

  describe('connect', () => {
    it('should create connection to master server', (done) => {
      mockery.registerMock('socket.io-client', {
        connect : (server, options) => {
          server.should.be.equal('http://127.0.0.1:666');
          options.should.be.eql({
            transports : ['websocket']
          });

          done();

          return socketMock;
        }
      });

      backchannel.connect();
    });

    it('should set its status as connected once socket emits connect event', () => {
      backchannel.connect();
      socketMock.emit('connect');

      backchannel._connected.should.be.equal(true);
    });

    it('should send update to master about hub status once connected', (done) => {
      backchannel._sendUpdate = done;

      backchannel.connect();
      socketMock.emit('connect');
    });

    it('should start send loop which will periodically send status updates' +
      ' to master', (done) => {
      backchannel._setupSendLoop = done;

      backchannel.connect();
      socketMock.emit('connect');
    });

    it('should be calling _handleDisconnect once socket disconnects', (done) => {
      backchannel._handleDisconnect = done;

      backchannel.connect();
      socketMock.emit('disconnect');
    });

    it('should not do anything bad if connect_error gets emitted by socket', () => {
      backchannel.connect();
      socketMock.emit('connect_error', new Error('test error'));
    });
  });

  describe('_setupSendLoop', () => {
    it('should create interval which will send status updates to master', () => {
      backchannel._setupSendLoop();
      should.exist(backchannel._sendInterval);
    });
  });

  describe('_sendUpdate', () => {
    beforeEach(() => {
      backchannel.connect();
      socketMock.emit('connect');
    });

    it('should not send anything if socket hasnt connected', () => {
      backchannel._connected = false;
      socketMock.emit = () => {
        throw new Error('should not have been called');
      };

      backchannel._sendUpdate();
    });

    it('should send HubUpdate event with details of the hub to master', (done) => {
      socketMock.on('HubUpdate', (data) => {
        data.should.be.eql({
          health     : {},
          ip         : '127.0.0.1',
          port       : 777,
          maxTabs    : 5,
          activeTabs : 0,
          location   : 'ams1'
        });
        done();
      });

      backchannel._sendUpdate();
    });

    it('should clear current update interval and recreate a new one, to ' +
      'reset time between messages', (done) => {
      backchannel._sendInterval = setInterval(() => {
        throw new Error('should not have been called');
      }, 1);
      backchannel._setupSendLoop = done;

      backchannel._sendUpdate();
    });
  });

  describe('_handleDisconnect', () => {
    it('should reconnect back', (done) => {
      backchannel.connect = done;
      backchannel._handleDisconnect();
    });

    it('should clear update interval', () => {
      backchannel._sendInterval = setInterval(() => {
        throw new Error('should not have been called');
      }, 1);

      backchannel._handleDisconnect();
    });
  });
});
