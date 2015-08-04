'use strict';
var BaseController = require('./base_controller');
var Model = require('@hoist/model');
var BBPromise = require('bluebird');
var logger = require('@hoist/logger');
var util = require('util');

function HealthCheckController() {
  this._count = 0;
  BaseController.apply(this, arguments);
}

util.inherits(HealthCheckController, BaseController);

HealthCheckController.prototype.heartbeat = function (request, reply) {
  return BBPromise.resolve(null)
    .bind(this)
    .then(function () {
      this._count++;
      logger.info('carrying out heartbeat');
      if (Model._mongoose.connection.readyState !== 1) {
        return reply(500, {
          database: false,
          ok: false,
          count: this._count
        })
      }
      if (this._count > 100) {
        return reply(500, {
          ok: false,
          count: this._count
        });
      }

      return reply({
        database: true,
        ok: true,
        count: this._count
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
