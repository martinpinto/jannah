"use strict";

let RestServer = require('../../../lib/hub/restServer'),
  TabList = require('../../../lib/hub/tabList'),
  should = require('should'),
  restify = require('restify'),
  httpMocks = require('node-mocks-http'),
  mockery = require('mockery');

describe('restServer', () => {
  let restServer, mockRequest, mockResponse, tabList, SummonerMock;

  before(() => {
    mockery.enable({
      warnOnUnregistered : false
    });
  });

  after(() => {
    mockery.disable();
  });

  beforeEach(() => {
    tabList = new TabList([55500, 55555]);
    restServer = new RestServer('127.0.0.1', tabList);
    restServer._port = 9999;
    mockRequest = httpMocks.createRequest();
    mockResponse = httpMocks.createResponse();

    SummonerMock = (engine, ip, port, restPort, callback) => {
      this.release = () => {
        callback({
          url : 'http://' + ip + ':' + port
        });
      };

      this.on = () => {};
    };
  });

  it('should be exported as function', () => {
    RestServer.should.be.a.Function();
  });

  describe('_postTab', () => {
    beforeEach(() => {
      mockRequest._setBody({
        engine  : 'gecko',
        adblock : true
      });

      tabList.getPort = (callback) => {
        callback(666);
      };
    });

    it('should call next with an invalid argument error if engine isnt one of' +
    ' the supported ones', (done) => {
      mockRequest._setBody({
        engine  : 'trolololo',
        adblock : true
      });

      restServer._postTab(mockRequest, mockResponse, (error) => {
        error.should.be.an.instanceof(restify.InvalidArgumentError);
        done();
      });
    });

    it('should call next with an invalid argument error if adblock value isnt' +
      ' boolean', (done) => {
      mockRequest._setBody({
        engine : 'gecko',
        adblock : 'yolo'
      });

      restServer._postTab(mockRequest, mockResponse, (error) => {
        error.should.be.an.instanceof(restify.InvalidArgumentError);
        done();
      });
    });

    it('should call next with a service unavailable error if could not allocate' +
      'new port for tab', done => {
      tabList.getPort = (callback) => {
        callback(null);
      };

      restServer._postTab(mockRequest, mockResponse, (error) => {
        error.should.be.an.instanceof(restify.ServiceUnavailableError);
        done();
      });
    });

    it('should create summoner with selected port and engine', (done) => {
      mockery.registerMock('./summoner', (engine, serverIp, port, restPort, callback) => {
        engine.should.be.equal('gecko');
        serverIp.should.be.equal('127.0.0.1');
        port.should.be.equal(666);
        restPort.should.be.equal(9999);
        callback.should.be.a.Function();
        done();

        this.on = function(){};
      });

      restServer._postTab(mockRequest, mockResponse);
    });

    it('should send back ip address once tab gets released', function() {
      mockery.registerMock('./summoner', SummonerMock);
      restServer._postTab(mockRequest, mockResponse);
      tabList.release(666);

      mockResponse._getData().should.be.eql({
        url : 'http://127.0.0.1:666'
      });
    });
  });

  describe('_postAnnounceTab', () => {
    it('should release tab with specified port', (done) => {
      tabList.release = (port) => {
        port.should.be.equal(666);
        done();
      };
      mockRequest._setBody({
        port : 666
      });

      restServer._postAnnounceTab(mockRequest, mockResponse);
    });
  });
});
