'use strict';
var BaseController = require('./base_controller');
var Model = require('hoist-model');
var errors = require('hoist-errors');
var util = require('util');
var BBPromise = require('bluebird');

function RedirectController() {
  BaseController.apply(this, arguments);
}

util.inherits(RedirectController, BaseController);

RedirectController.prototype.initiateBounce = function (request, reply) {
  BBPromise.try(function () {
      return Model.Organisation.findOneAsync({
        slug: request.params.orgSlug
      });
    }).bind(this)
    .then(function (organisation) {
      if (!organisation) {
        throw new errors.Http404Error('invalid organisation slug');
      }
      return Model.Application.findOneAsync({
        slug: request.params.appSlug,
        organisation: organisation._id
      });
    }).then(function (application) {
      if (!application) {
        throw new errors.Http404Error('invalid application slug');
      }
      return Model.ConnectorSetting.findOneAsync({
        environment: 'live',
        application: application._id,
        key: request.params.key
      });
    }).then(function (connectorSettings) {
      if (!connectorSettings) {
        throw new errors.Http404Error('invalid connector settings key');
      }
      var bouncerToken = new Model.BouncerToken({
        application: connectorSettings.application,
        environment: connectorSettings.environment,
        connectorKey: connectorSettings.key,
      });
      return bouncerToken.saveAsync();
    }).spread(function (token) {
      reply.redirect('/bounce/' + token.key);
    }).catch(this.errorProcessor(reply));
};

RedirectController.prototype.initRoutes = function (server) {
  server.route({
    method: 'GET',
    path: '/initiate/{orgSlug}/{appSlug}/{key}',
    handler: this.initiateBounce
  });
};

module.exports = new RedirectController();
