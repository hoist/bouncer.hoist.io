'use strict';
require('../bootstrap');

var Model = require('@hoist/model');
var Hapi = require('hapi');
var sinon = require('sinon');
var router = require('../../lib/routes');
var server = require('../../lib/server');
var expect = require('chai').expect;
var Bluebird = require('bluebird');

describe('BouncerServer', function () {
  describe('#start', function () {
    var mockHapiServer = {
      connection: sinon.stub(),
      start: sinon.stub().yields(),
      state: sinon.stub(),
      views: sinon.stub()
    };
    before(function (done) {
      sinon.stub(Hapi, 'Server').returns(mockHapiServer);
      sinon.stub(router, 'init');
      sinon.stub(Model._mongoose, 'connect').yields();
      server.start().then(done);
    });
    after(function () {
      Hapi.Server.restore();
      router.init.restore();
      Model._mongoose.connect.restore();
    });
    it('creates state for token', function () {
      return expect(mockHapiServer.state)
        .to.have.been.calledWith('bouncer-token', {
          domain: 'bouncer.hoist.local',
          clearInvalid: true,
          ignoreErrors: true,
          encoding: 'iron',
          isHttpOnly: true,
          isSecure: true,
          password: 'test_encryption_key',
          autoValue: {},
          path: '/'
        });
    });
    it('creates a hapi server', function () {
      return expect(mockHapiServer.connection)
        .to.have.been
        .calledWith({
          host: '0.0.0.0',
          port: 8000
        });
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
      stopAsync: sinon.stub().returns(Bluebird.resolve())
    };
    before(function (done) {
      server.server = mockHapiServer;
      sinon.stub(Model._mongoose, 'disconnect').yields();
      server.end().then(done);
    });
    after(function () {
      Model._mongoose.disconnect.restore();
    });
    it('stops hapi server', function () {
      return expect(mockHapiServer.stopAsync)
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
