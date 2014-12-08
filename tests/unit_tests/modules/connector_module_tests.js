'use strict';
var connectorModule = require('../../../lib/modules/connector_module');
var TestConnector = require('../../fixtures/connectors/test-connector/current');
var expect = require('chai').expect;
describe('ConnectorModule', function () {
  describe('#loadConnector', function () {
    var _connector;
    before(function () {
      return connectorModule.loadConnector({
        type: 'test-connector'
      }).then(function(connector){
        _connector = connector;
      });
    });
    it('returns instance of test connector', function () {
      return expect(_connector).to.be.instanceOf(TestConnector);
    });
  });
});
