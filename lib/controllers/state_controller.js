'use strict';
var BaseController = require('./base_controller');
var util = require('util');
var connectorModule = require('../modules/connector_module');
var BBPromise = require('bluebird');
var errors = require('hoist-errors');
var Model = require('hoist-model');
var _ = require('lodash');

function Bounce(request, reply, bounceToken) {
  _.bindAll(this);
  this._request = request;
  this._reply = reply;
  this._bounceToken = bounceToken;
}
Bounce.prototype.set = function (key, value) {
  this._bounceToken.state[key] = value;
  this._bounceToken.saveAsync();
};
Bounce.prototype.redirect = function (url) {
  this._reply.redirect(url).state('bouncer-token', this._bounceToken.key);
};

function StateController() {
  BaseController.apply(this, arguments);
}

util.inherits(StateController, BaseController);

StateController.prototype.bounce = function (request, reply) {

  BBPromise.try(function () {
    var key = request.params.key || request.state['bouncer-token'];
    if (!key) {
      throw new errors.Http404Error('invalid bounce key');
    }
    return Model.BouncerToken.findOneAsync({
      key: key
    });
  }).then(function (token) {
    if (!token) {
      throw new errors.Http404Error('invalid bounce key');
    }
    return Model.ConnectorSetting.findOneAsync({
      application: token.application,
      environment: token.environment,
      key: token.connectorKey
    }).then(function (connectorSettings) {
      if (!connectorSettings) {
        throw new errors.Http404Error('invalid bounce key');
      }
      var bounce = new Bounce(request, reply, token);
      return connectorModule.loadConnector(connectorSettings)
        .then(function (connector) {
          return connector.receiveBounce(bounce);
        });
    });
  }).catch(this.errorProcessor(reply));
};

StateController.prototype.initRoutes = function (server) {
  server.route({
    method: 'GET',
    path: '/bounce/{key?}',
    handler: this.bounce
  });
};

module.exports = new StateController();
