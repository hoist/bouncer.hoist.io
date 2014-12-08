'use strict';
require('../bootstrap');
var Hapi = require('hapi');
var sinon = require('sinon');
var router = require('../../lib/routes');
var server = require('../../lib/server');
var expect = require('chai').expect;
var Model = require('hoist-model');

describe('BouncerServer', function () {
  describe('#start', function () {
    var mockHapiServer = {
      start: sinon.stub().yields(),
      state: sinon.stub()

    };
    before(function (done) {
      sinon.stub(Hapi, 'Server').returns(mockHapiServer);
      sinon.stub(router, 'init');
      sinon.stub(Model._mongoose, 'connect').yields();
      server.start(done);
    });
    after(function () {
      Hapi.Server.restore();
      router.init.restore();
      Model._mongoose.connect.restore();
    });
    it('creates state for token', function () {
      return expect(mockHapiServer.state)
        .to.have.been.calledWith('bouncer-token', {
          domain: 'bouncer.hoist.io',
          encoding: 'iron',
          isHttpOnly: true,
          isSecure: true,
          password: 'test_encryption_key',
          autoValue: {}
        });
    });
    it('creates a hapi server', function () {
      return expect(Hapi.Server)
        .to.have.been
        .calledWith(3000);
    });
    it('starts server', function () {
      return expect(mockHapiServer.start)
        .to.have.been.called;
    });
    it('calls config', function () {
      return expect(router.init)
        .to.have.been
        .calledWith(mockHapiServer);
    });
    it('connects mongoose', function () {
      return expect(Model._mongoose.connect)
        .to.have.been.called;
    });
  });
  describe('#end', function () {
    var mockHapiServer = {
      stop: sinon.stub().yields()
    };
    before(function (done) {
      server.server = mockHapiServer;
      sinon.stub(Model._mongoose, 'disconnect').yields();
      server.end(done);
    });
    after(function () {
      Model._mongoose.disconnect.restore();
    });
    it('stops hapi server', function () {
      return expect(mockHapiServer.stop)
        .to.have.been.called;
    });
    it('disconnects mongoose', function () {
      return expect(Model._mongoose.disconnect)
        .to.have.been.called;
    });
    it('deletes server instance', function () {
      return expect(server.server)
        .to.not.exist;
    });
  });
});
