'use strict';
var _ = require('lodash');
var BBPromise = require('bluebird');
var fs = BBPromise.promisifyAll(require('fs'));
var errors = require('@hoist/errors');
var config = require('config');
var path = require('path');
var logger = require('@hoist/logger').child({
  cls: 'ConnectorModule'
});

function ConnectorModule() {
  _.bindAll(this);
}

ConnectorModule.prototype.loadConnector = function (connectorSettings) {

  return BBPromise.try(function () {
      var connectorPath = path.resolve(path.join(config.get('Hoist.filePaths.connectors'), connectorSettings.connectorType, 'current'));
      /*istanbul ignore if */
      if (!fs.existsSync(connectorPath)) {
        throw new errors.connector.InvalidError();
      }

      var realpath = fs.readlinkSync(connectorPath);
      logger.info({
        connectorPath: connectorPath,
        realpath: realpath
      }, 'connectorPath');
      return require(realpath);
    }).bind(this)
    .then(function (Connector) {
      connectorSettings.settings._connectorKey = connectorSettings.key;
      connectorSettings.settings._applicationId = connectorSettings.application;
      return new Connector(connectorSettings.settings);
    });
};

module.exports = new ConnectorModule();
