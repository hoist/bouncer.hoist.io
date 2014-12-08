'use strict';
var _ = require('lodash');

function ConnectorModule() {
  _.bindAll(this);
}

ConnectorModule.prototype.loadConnector = function () {

};

module.exports = new ConnectorModule();
