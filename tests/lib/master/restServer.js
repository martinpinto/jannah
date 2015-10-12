"use strict";

let RestServer = require('../../../lib/master/restServer'),
  HubRegistry = require('../../../lib/master/hubRegistry'),
  httpMocks = require('node-mocks-http'),
  nock = require('nock'),
  should = require('should'),
  restify = require('restify'),
  MockRes = require('mock-res');

describe('restServer', () => {
  let restServer, hubRegistry, mockRequest, mockResponse;

  before(() => {
    nock.disableNetConnect();
  });

  after(() => {
    nock.enableNetConnect();
    nock.restore();
  });

  beforeEach(() => {
    hubRegistry = new HubRegistry();
    restServer = new RestServer(hubRegistry);
    mockRequest = httpMocks.createRequest({
      body : {
        engine : 'webkit'
      }
    });
    mockResponse = new httpMocks.createResponse();

    hubRegistry.update('id1', {
      location   : 'asm1',
      ip         : '8.8.8.8',
      port       : 666,
      maxTabs    : 5,
      activeTabs : 1
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('_postSessions', () => {
    it('should be calling next with a service unavailable error if no hubs are available', done => {
      hubRegistry.remove('id1');
      restServer._postSessions(mockRequest, mockResponse, (error) => {
        error.should.be.an.instanceof(restify.ServiceUnavailableError);
        done();
      });
    });

    it('should be calling next with an invalid argument error if engine is provided' +
      'but it isnt one of the supported', done => {
        mockRequest._setBody({
          engine : 'trolololo'
        });

        restServer._postSessions(mockRequest, mockResponse, error => {
          error.should.be.an.instanceof(restify.InvalidArgumentError);
          done();
        });
    });

    it('should make request to hub to create new session, response from hub should be' +
      'sent to requester', done => {
        //request is piping its response node-mocks-http don't support streams out of box
        mockResponse = new MockRes();
        nock('http://8.8.8.8:666')
          .log(console.log)
          .post('/new', {
            engine : 'webkit'
          })
          .reply(200, {
            url : '8.8.8.8:8888'
          });

        mockResponse.on('finish', () => {
          mockResponse.statusCode.should.be.equal(200);
          mockResponse._getJSON().should.be.eql({
            url : '8.8.8.8:8888'
          });
          done();
        });

        restServer._postSessions(mockRequest, mockResponse);
    });
  });

  describe('_getHubs', () => {
    it('should return an array of hubs', () => {
      restServer._getHubs(mockRequest, mockResponse);
      mockResponse._getData().should.be.eql([{
        location   : 'asm1',
        ip         : '8.8.8.8',
        port       : 666,
        maxTabs    : 5,
        activeTabs : 1
      }]);
    });
  });
});
