'use strict';
require('../../bootstrap');
var StateController = require('../../../lib/controllers/state_controller');
var sinon = require('sinon');
var expect = require('chai').expect;
var BouncerServer = require('../../../lib/server');
var Model = require('@hoist/model');
var cookie = require('simple-cookie');
var BBPromise = require('bluebird');
var iron = BBPromise.promisifyAll(require('iron'));
var ConnectorModule = require('../../../lib/modules/connector_module');
var config = require('config');

describe('StateController', function () {
  describe('#initRoutes', function () {
    var server = {
      route: sinon.stub()

    };
    before(function () {
      StateController.initRoutes(server);
    });
    it('registers initateBounce', function () {
      return expect(server.route)
        .to.be.calledWith({
          handler: StateController.bounce,
          path: '/bounce/{key?}',
          method: 'GET'
        });
    });
  });
  describe('GET /bounce', function () {
    var _response;
    var server = BouncerServer.getServer();
    var bouncerToken = new Model.BouncerToken({
      application: 'appid',
      environment: 'live',
      key: 'bounce_token',
      connectorKey: 'connector_key'
    });
    var connectorSettings = {
      application: 'appid',
      environment: 'live',
      key: 'connector_key',
      type: 'test_connector'
    };
    var connector = {
      receiveBounce: function (bounce) {
        bounce.set('key', 'value').then(function() {
          return bounce.setDisplayProperty('Organisation Name', 'Hoist Apps Limited');
        }).then(function() {
          return bounce.setDisplayProperty('Organisation Name', 'Super Star');
        }).then(function() {
          return bounce.redirect('http://example.com');
        });
      }
    };
    before(function (done) {
      sinon.stub(bouncerToken, 'saveAsync').returns(BBPromise.resolve(null));
      sinon.stub(ConnectorModule, 'loadConnector')
        .withArgs(connectorSettings)
        .returns(BBPromise.resolve(connector));
      sinon.stub(Model.BouncerToken, 'findOneAsync')
        .withArgs({
          key: 'bounce_token'
        }).returns(BBPromise.resolve(bouncerToken));
      sinon.stub(Model.ConnectorSetting, 'findOneAsync')
        .withArgs({
          application: 'appid',
          environment: 'live',
          key: 'connector_key'
        }).returns(BBPromise.resolve(connectorSettings));

      return iron.seal({
        key: 'bounce_token'
      }, config.get('Hoist.cookies.bouncer.password'), iron.defaults, function (err, value) {
        var c = cookie.stringify({
          name: 'bouncer-token',
          value: value,
        });
        server.inject({
          method: 'GET',
          url: '/bounce',
          headers: {
            cookie: c
          }
        }, function (response) {
          _response = response;
          done();
        });
      });
    });
    after(function () {
      bouncerToken.saveAsync.restore();
      ConnectorModule.loadConnector.restore();
      Model.BouncerToken.findOneAsync.restore();
      Model.ConnectorSetting.findOneAsync.restore();
    });
    it('redirects user', function () {
      return expect(_response.statusCode).to.eql(302);
    });
    it('saves state', function () {
      return expect(bouncerToken.saveAsync).to.have.been.called;
    });
    it('sets state key', function () {
      return expect(bouncerToken.state.key).to.eql('value');
    });
    it('sets display property', function () {
      return expect(bouncerToken.displayProperties[0].name).to.eql('Organisation Name');
    });
    it('sets overwrites original property', function () {
      return expect(bouncerToken.displayProperties[0].value).to.eql('Super Star');
    });
    it('sets token in browser state', function () {
      var cookies = cookie.parse(_response.headers['set-cookie'][0]);
      return BBPromise.try(function () {
        return iron.unsealAsync(cookies.value, config.get('Hoist.cookies.bouncer.password'), iron.defaults);
      }).then(function (value) {
        expect(value).to.eql(bouncerToken.toObject());
      });
    });
  });
  describe('GET /bounce/{key}', function () {
    var _response;
    var server = BouncerServer.getServer();
    var bouncerToken = new Model.BouncerToken({
      application: 'appid',
      environment: 'live',
      key: 'bounce_token',
      connectorKey: 'connector_key'
    });
    var connectorSettings = {
      application: 'appid',
      environment: 'live',
      key: 'connector_key',
      type: 'test_connector'
    };
    var connector = {
      receiveBounce: function (bounce) {
        bounce.set('key', 'value');
        bounce.redirect('http://example.com');
      }
    };
    before(function (done) {
      sinon.stub(bouncerToken, 'saveAsync').returns(BBPromise.resolve(null));
      sinon.stub(ConnectorModule, 'loadConnector')
        .withArgs(connectorSettings)
        .returns(BBPromise.resolve(connector));
      sinon.stub(Model.BouncerToken, 'findOneAsync')
        .withArgs({
          key: 'bounce_token'
        }).returns(BBPromise.resolve(bouncerToken));
      sinon.stub(Model.ConnectorSetting, 'findOneAsync')
        .withArgs({
          application: 'appid',
          environment: 'live',
          key: 'connector_key'
        }).returns(BBPromise.resolve(connectorSettings));
      server.inject({
        method: 'GET',
        url: '/bounce/bounce_token'
      }, function (response) {
        _response = response;
        done();
      });
    });
    after(function () {
      bouncerToken.saveAsync.restore();
      ConnectorModule.loadConnector.restore();
      Model.BouncerToken.findOneAsync.restore();
      Model.ConnectorSetting.findOneAsync.restore();
    });
    it('redirects user', function () {
      return expect(_response.statusCode).to.eql(302);
    });
    it('saves state', function () {
      return expect(bouncerToken.saveAsync).to.have.been.called;
    });
    it('sets state key', function () {
      return expect(bouncerToken.state.key).to.eql('value');
    });
    it('sets token in browser state', function () {
      var c = cookie.parse(_response.headers['set-cookie'][0]);
      return BBPromise.try(function () {
        expect(c.name).to.eql('bouncer-token');
        return iron.unsealAsync(c.value, config.get('Hoist.cookies.bouncer.password'), iron.defaults);
      }).then(function (value) {
        expect(value).to.eql(bouncerToken.toObject());
      });
    });
    describe('with invalid bounce token', function () {
      var _response;
      before(function (done) {
        server.inject({
          method: 'GET',
          url: '/bounce/other_bounce_token'
        }, function (response) {
          _response = response;
          done();
        });
      });
      it('returns 404 error', function () {
        return expect(_response.statusCode).to.eql('404');
      });
    });
    describe('with invalid connector key on bounce token', function () {
      var _response;
      var otherBouncerToken = new Model.BouncerToken({
        application: 'appid',
        environment: 'live',
        key: 'another_bounce_token',
        connectorKey: 'other_connector_key'
      });
      before(function (done) {
        Model.BouncerToken.findOneAsync
          .withArgs({
            key: 'another_bounce_token'
          }).returns(BBPromise.resolve(otherBouncerToken));
        Model.ConnectorSetting.findOneAsync.returns(BBPromise.resolve(null));
        server.inject({
          method: 'GET',
          url: '/bounce/another_bounce_token'
        }, function (response) {
          _response = response;
          done();
        });
      });
      it('returns 404 error', function () {
        return expect(_response.statusCode).to.eql('404');
      });
    });
  });
});
