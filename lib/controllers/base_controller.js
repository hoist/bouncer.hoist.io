'use strict';
var logger = require('hoist-logger');
var errors = require('hoist-errors');
var _ = require('lodash');
//var ConnectorModule = require('../modules/connector_module');
function BaseController() {
  _.bindAll(this);
}
/* istanbul ignore next */
BaseController.prototype.initRoutes = function () {
  //override in subclasses
};

BaseController.prototype.errorProcessor = function (reply) {
  return function (err) {
    logger.warn(err);
    if (!errors.isHoistError(err) && !err.code) {
      console.log(err,err.stack);
      logger.error(err);
      err = new errors.hoistError();
    } else {
      logger.warn(err);
    }
    var response = reply(err.message);
    response.statusCode = err.code || /* istanbul ignore next */ 500;
  };
};
module.exports = BaseController;
