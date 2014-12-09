'use strict';
var BaseController = require('./base_controller');
var Model = require('hoist-model');
var errors = require('hoist-errors');
var config = require('config');
var url = require('url');
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
        returnUrl: request.query.returnUrl,
        application: connectorSettings.application,
        environment: connectorSettings.environment,
        connectorKey: connectorSettings.key
      });
      var bouncerSetup = BBPromise.resolve(null);
      /*istanbul ignore if */
      if (request.query.bucketKey) {
        bouncerSetup = Model.Bucket.findOneAsync({
          key: request.query.bucketKey,
          application: connectorSettings.application,
          environment: connectorSettings.environment
        }).then(function (bucket) {
          if (!bucket) {
            throw new errors.connector.request.InvalidError('invalid bucket key');
          }
          bouncerToken.saveTo = 'bucket';
          bouncerToken.saveId = bucket._id;
        });
      }
      /*istanbul ignore if */
      if (request.query.userId) {
        bouncerSetup = Model.AppUser.findOneAsync({
          _id: request.query.userId,
          application: connectorSettings.application,
          environment: connectorSettings.environment
        }).then(function (user) {
          if (!user) {
            throw new errors.connector.request.InvalidError('invalid user id');
          }
          bouncerToken.saveTo = 'user';
          bouncerToken.saveId = user._id;
        });
      }
      return bouncerSetup.then(function () {
        return bouncerToken.saveAsync();
      });

    }).then(function (token) {

      var redirectUrl = {
        protocol: 'http',
        host: config.get('Hoist.domains.bouncer'),
        pathname: '/bounce/' + token.key
      };
      if (config.get('Hoist.http.secure')) {
        redirectUrl.protocol = 'https';
      }
      var response = reply.redirect(url.format(redirectUrl));
      response.headers['x-hoist-auth-token'] = token.key;
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
