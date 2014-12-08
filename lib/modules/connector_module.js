'use strict';
var _ = require('lodash');
var BBPromise = require('bluebird');
var fs = BBPromise.promisifyAll(require('fs'));
var errors = require('hoist-errors');
var config = require('config');
var path = require('path');

function ConnectorModule() {
  _.bindAll(this);
}

ConnectorModule.prototype.loadConnector = function (connectorSettings) {

  return BBPromise.try(function () {
      var connectorPath = path.resolve(path.join(config.get('Hoist.connectors.path'), connectorSettings.type, config.get('Hoist.connectors.currentDirectoryName')));
      if (!fs.existsSync(connectorPath)) {
        throw new errors.connector.InvalidError();
      }

      return require(connectorPath);
    }).bind(this)
    .then(function (Connector) {
      return new Connector(connectorSettings);
    });
};

module.exports = new ConnectorModule();
