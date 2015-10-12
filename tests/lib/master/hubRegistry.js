"use strict";
let HubRegistry = require('../../../lib/master/hubRegistry'),
  should = require('should');

describe('hubRegistry', function() {
  let registry;

  beforeEach(function() {
    registry = new HubRegistry();
    registry.update('id1', {
      location   : 'ams1',
      maxTabs    : 5,
      activeTabs : 2,
      ip         : '127.0.0.1'
    });
  });

  it('should be exported as a function', function() {
    HubRegistry.should.be.a.Function();
  });

  describe('update', function() {
    it('should update value in registry', function() {
      registry.update('id1', {
        location   : 'ams1',
        maxTabs    : 5,
        activeTabs : 3,
        ip         : '127.0.0.1'
      });

      registry._registry.get('id1').should.be.eql({
        location   : 'ams1',
        maxTabs    : 5,
        activeTabs : 3,
        ip         : '127.0.0.1'
      });
    });

    it('should add a new entry to registry if it doesnt exist yet', function() {
      registry.update('id2', {
        location   : 'ams2',
        maxTabs    : 3,
        activeTabs : 0,
        ip         : '127.0.0.1'
      });

      registry._registry.get('id2').should.be.eql({
        location   : 'ams2',
        maxTabs    : 3,
        activeTabs : 0,
        ip         : '127.0.0.1'
      });
    });
  });

  describe('remove', function() {
    it('should remove hub entry from registry', function() {
      registry.remove('id1');

      registry._registry.has('id1').should.be.equal(false);
    });
  });

  describe('find', function() {
    beforeEach(function() {
      registry.update('id2', {
        location   : 'ams2',
        maxTabs    : 5,
        activeTabs : 1,
        ip         : '127.0.0.1'
      });

      registry.update('id3', {
        location   : 'ams2',
        maxTabs    : 5,
        activeTabs : 2,
        ip         : '127.0.0.1'
      });

      registry.update('id4', {
        location   : 'ams3',
        maxTabs    : 10,
        activeTabs : 3,
        ip         : '127.0.0.1'
      });

      registry.update('id5', {
        location   : 'sfo1',
        maxTabs    : 5,
        activeTabs : 5,
        ip         : '127.0.0.1'
      });
    });

    it('should return hub by its location if location is specified', function() {
      registry.find('ams1').should.be.eql({
        location   : 'ams1',
        maxTabs    : 5,
        activeTabs : 2,
        ip         : '127.0.0.1'
      });
    });

    it('should return null if no hubs could be found for given location', function() {
      should.strictEqual(registry.find('nyc1'), null);
    });

    it('should pick server with the greatest capacity if no location is provided', function() {
      registry.find().should.be.eql({
        location   : 'ams3',
        maxTabs    : 10,
        activeTabs : 3,
        ip         : '127.0.0.1'
      });
    });

    it('should pick server with the greatest capacity for given location', function() {
      registry.find('ams2').should.be.eql({
        location   : 'ams2',
        maxTabs    : 5,
        activeTabs : 1,
        ip         : '127.0.0.1'
      });
    });

    it('should return null if no servers with spare capacity for given location can be found', function() {
      should.strictEqual(registry.find('sfo1'), null);
    });
  });
});