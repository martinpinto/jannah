"use strict";

let TabList = require('../../../lib/hub/tabList'),
  should = require('should'),
  EventEmitter = require('events').EventEmitter;

describe('tabList', () => {
  let tabList, tabMock;

  beforeEach(function() {
    tabList = new TabList();
    tabMock = new EventEmitter();
    tabMock.release = function(){};

    tabList.add(666, tabMock);
  });

  it('should be exported as a function', () => {
    TabList.should.be.a.Function();
  });

  it('should be an event emitter', () => {
    tabList.should.be.an.instanceof(EventEmitter);
  });

  describe('add', () => {
    beforeEach(() => {
      tabList = new TabList();
    });

    it('should add tab with its port to internal lists', () => {
      tabList.add(666, tabMock);
      tabList._list.has(666).should.be.equal(true);
      tabList._usedPorts.has(666).should.be.equal(true);
    });

    it('should remove tab when tab emits exit event', () => {
      tabList.add(666, tabMock);

      tabMock.emit('exit');

      tabList._list.has(666).should.be.equal(false);
    });

    it('should emit tabChanges event when tab is added', (done) => {
      tabList.once('tabChanges', done);

      tabList.add(666, tabMock);
    });
  });

  describe('remove', () => {
    it('should remove tab from all of its internal lists', () => {
      tabList.add(666, tabMock);
      tabList.release(666);

      tabList.remove(666);

      tabList._list.has(666).should.be.equal(false);
      tabList._usedPorts.has(666).should.be.equal(false);
      tabList._released.has(666).should.be.equal(false);
    });

    it('should emit tabChanges event when tab is removed', (done) => {
      tabList.on('tabChanges', done);
      tabList.remove(666);
    });
  });

  describe('release', () => {
    it('should call tab release method', (done) => {
      tabMock.release = done;

      tabList.release(666);
    });

    it('should not call tab release method twice', () => {
      tabList.release(666);
      tabMock.release = () => {
        throw new Error('Should not have been called');
      };
    });
  });

  describe('size', () => {
    it('should return count of how many tabs have been added', () => {
      tabList.size().should.be.equal(1);
    });
  });
});
