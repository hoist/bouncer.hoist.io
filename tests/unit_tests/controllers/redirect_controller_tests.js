'use strict';
var RedirectController = require('../../../lib/controllers/redirect_controller');
var sinon = require('sinon');
var expect = require('chai').expect;
var BouncerServer = require('../../../lib/server');
var Model = require('hoist-model');
var BBPromise = require('bluebird');

describe('RedirectController', function () {
  describe('#initRoutes', function () {
    var server = {
      route: sinon.stub()

    };
    before(function () {
      RedirectController.initRoutes(server);
    });
    it('registers initateBounce', function () {
      return expect(server.route)
        .to.be.calledWith({
          handler: RedirectController.initiateBounce,
          path: '/initiate/{orgSlug}/{appSlug}/{key}',
          method: 'GET'
        });
    });
  });
  describe('routes', function () {
    describe('GET /initiate/{orgSlug}/{appSlug}/{key}', function () {
      var organisation = {
        _id: 'orgid'
      };
      var application = {
        _id: 'appid'
      };
      var connectorSettings = {
        application: 'appid',
        environment: 'live',
        key: 'connectorkey'
      };
      var server = BouncerServer.getServer();
      var token = {
        key: 'tokenkey'
      };
      var _response;
      var _savedToken;
      before(function (done) {
        sinon.stub(Model.Organisation, 'findOneAsync')
          .withArgs({
            slug: 'org_slug'
          }).returns(BBPromise.resolve(organisation));
        sinon.stub(Model.Application, 'findOneAsync')
          .withArgs({
            slug: 'app_slug',
            organisation: 'orgid'
          }).returns(BBPromise.resolve(application));
        sinon.stub(Model.ConnectorSetting, 'findOneAsync')
          .withArgs({
            application: 'appid',
            environment: 'live',
            key: 'my_connector_key'
          }).returns(BBPromise.resolve(connectorSettings));
        sinon.stub(Model.BouncerToken.prototype, 'saveAsync', function () {
          _savedToken = this;
          return BBPromise.resolve([token]);
        });
        server.inject({
          method: 'GET',
          url: '/initiate/org_slug/app_slug/my_connector_key'
        }, function (response) {
          _response = response;
          done();
        });
      });
      it('creates a bouncer token', function () {
        return expect(_savedToken).to.exist;
      });
      it('redirects the user to bounce', function () {
        return expect(_response.headers.location)
          .to.match(/\/bounce\/tokenkey$/);
      });
      describe('with invalid key', function () {
        var _response;
        before(function (done) {
          server.inject({
            method: 'GET',
            url: '/initiate/org_slug/app_slug/other_connector_key'
          }, function (response) {
            _response = response;
            done();
          });
        });
        it('returns 404 error', function () {
          return expect(_response.statusCode)
            .to.eql('404');
        });
      });
      describe('with invalid appSlug', function () {
        var _response;
        before(function (done) {
          server.inject({
            method: 'GET',
            url: '/initiate/org_slug/other_app_slug/my_connector_key'
          }, function (response) {
            _response = response;
            done();
          });
        });
        it('returns 404 error', function () {
          return expect(_response.statusCode)
            .to.eql('404');
        });
      });
      describe('with invalid orgSlug', function () {
        var _response;
        before(function (done) {
          server.inject({
            method: 'GET',
            url: '/initiate/other_org_slug/app_slug/my_connector_key'
          }, function (response) {
            _response = response;
            done();
          });
        });
        it('returns 404 error', function () {
          return expect(_response.statusCode)
            .to.eql('404');
        });
      });
      after(function () {
        Model.Organisation.findOneAsync.restore();
        Model.Application.findOneAsync.restore();
        Model.ConnectorSetting.findOneAsync.restore();
        Model.BouncerToken.prototype.saveAsync.restore();
      });
    });
  });
});
