"use strict";

let SocketServer = require('../../../lib/master/socketServer'),
  HubRegistry = require('../../../lib/master/hubRegistry'),
  should = require('should'),
  EventEmitter = require('events').EventEmitter,
  mockery = require('mockery');

describe('socketServer', function() {
  let socketIoMock, hubRegistry, socketServer, socketIoServerEmitter;

  beforeEach(function() {
    mockery.enable();

    hubRegistry = new HubRegistry();

    socketIoServerEmitter = new EventEmitter();
    socketIoServerEmitter.listen = function(){};
    socketIoServerEmitter.serveClient = function(){};

    socketIoMock = function() {
      return socketIoServerEmitter;
    };

    mockery.registerMock('socket.io', socketIoMock);

    socketServer = new SocketServer(hubRegistry);
  });

  afterEach(function() {
    mockery.disable();
  });

  it('should be exported as a function', function() {
    SocketServer.should.be.a.Function();
  });

  describe('socket events', function() {
    let socket;

    beforeEach(function() {
      socket = new EventEmitter();
      socket.id = 'socketId1';
      socketIoServerEmitter.emit('connection', socket);
    });

    it('should be updating hub data in hub registry if HubUpdate event comes', function(done) {
      hubRegistry.update = function(id, data) {
        id.should.be.equal('socketId1');
        data.should.be.eql({
          location   : 'ams1',
          maxTabs    : 5,
          activeTabs : 1,
          ip         : '127.0.0.1'
        });

        done();
      };

      socket.emit('HubUpdate', {
        location   : 'ams1',
        maxTabs    : 5,
        activeTabs : 1,
        ip         : '127.0.0.1'
      });
    });

    it('should remove hub entry once socket disconnects', function(done) {
      hubRegistry.remove = function(id) {
        id.should.be.equal('socketId1');
        done();
      };
      socket.emit('disconnect');
    });
  });
});
