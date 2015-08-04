'use strict';
var BaseController = require('./base_controller');
var Model = require('@hoist/model');
var BBPromise = require('bluebird');
var logger = require('@hoist/logger');
var util = require('util');

function HealthCheckController() {
  BaseController.apply(this, arguments);
}

util.inherits(HealthCheckController, BaseController);

HealthCheckController.prototype.heartbeat = function (request, reply) {
  return BBPromise.resolve(null)
    .bind(this)
    .then(function () {
      logger.info('carrying out heartbeat');
      if (Model._mongoose.connection.readyState !== 1) {
        let response = reply({
          database: false,
          ok: false
        });
        response.code(500);
        return response;
      }

      return reply({
        database: true,
        ok: true
      });
    }).catch(this.errorProcessor(reply));
};

HealthCheckController.prototype.initRoutes = function (server) {
  server.route({
    method: 'GET',
    path: '/api/heartbeat',
    handler: this.heartbeat
  });
};

module.exports = new HealthCheckController();
