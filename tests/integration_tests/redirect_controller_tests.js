'use strict';
var BBPromise = require('bluebird');
var server = require('../../lib/server');
var config = require('config');
var Model = require('@hoist/model');
var expect = require('chai').expect;
var mongoose = Model._mongoose;
describe('Integration', function () {
  before(function (done) {

    if (mongoose.connection.db) {
      return done();
    }
    //mongoose.set('debug', true);
    mongoose.connect(config.get('Hoist.mongo.core.connectionString'), done);
  });
  after(function (done) {
    mongoose.disconnect(function () {
      delete mongoose.connection.db;
      done();
    });
  });
  describe('GET /initiate/{org}/{app}/{key}', function () {
    var organisation = new Model.Organisation({
      _id: 'orgid',
      name: 'test_org',
      slug: 'orgslug'
    });
    var application = new Model.Application({
      _id: 'appid',
      slug: 'appslug',
      organisation: 'orgid'
    });
    var connectorSetting = new Model.ConnectorSetting({
      name: 'my connector',
      application: 'appid',
      environment: 'live',
      key: 'connector_key'
    });
    var _response;
    before(function (done) {
      return BBPromise.all([
        organisation.saveAsync(),
        application.saveAsync(),
        connectorSetting.saveAsync()
      ]).then(function () {
        server.getServer().inject({
          method: 'GET',
          url: '/initiate/orgslug/appslug/connector_key'
        }, function (response) {
          _response = response;
          done();
        });
      });

    });
    after(function () {
      return BBPromise.all([
        Model.Organisation.removeAsync({}),
        Model.Application.removeAsync({}),
        Model.ConnectorSetting.removeAsync({}),
        Model.BouncerToken.removeAsync({})
      ]);
    });
    it('returns redirect', function () {
      console.log(_response);
      expect(_response.headers.location)
        .to.match(/\/bounce\/[^\/]*/);
    });
  });
});
