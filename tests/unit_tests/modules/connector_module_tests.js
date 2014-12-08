'use strict';
var connectorModule = require('../../../lib/modules/connector_module');
var TestConnector = require('../../fixtures/connectors/test-connector/deployed');
var Model = require('hoist-model');
var expect = require('chai').expect;
var path = require('path');
var fs = require('fs');
describe('ConnectorModule', function () {
  describe('#loadConnector', function () {
    var _connector;
    var deployedPath = path.resolve('./tests/fixtures/connectors/test-connector/deployed');

    var currentPath = path.resolve(deployedPath, '../current');
    before(function () {
      fs.symlinkSync(deployedPath, currentPath);
      return connectorModule.loadConnector(new Model.ConnectorSetting({
        connectorType: 'test-connector'
      })).then(function (connector) {
        _connector = connector;
      });
    });
    after(function () {
      fs.unlinkSync(currentPath);
    });
    it('returns instance of test connector', function () {
      return expect(_connector).to.be.instanceOf(TestConnector);
    });
  });
});
