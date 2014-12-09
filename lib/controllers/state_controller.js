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
  this.query = request.query;
}
Bounce.prototype.set = function (key, value, callback) {
  this._bounceToken.state[key] = value;
  this._bounceToken.markModified('state');
  return this._bounceToken.saveAsync().bind(this).then(function () {
    return this;
  }).nodeify(callback);
};
Bounce.prototype.get = function (key) {
  return this._bounceToken.state[key];
};
Bounce.prototype.done = function () {
  /*istanbul ignore next */
  if (this._bounceToken.saveTo && this._bounceToken.saveId) {
    /*istanbul ignore next */
    if (this._bounceToken.saveTo.toLowerCase() === 'bucket') {
      Model.Bucket.findOneAsync({
        _id: this._bounceToken.saveId,
        application: this._bounceToken.application,
        environment: this._bounceToken.environment
      }).then(function (bucket) {
        bucket.meta.authToken = this._bounceToken.key;
        bucket.markModified('meta');
        return bucket.saveAsync();
      });
    }
    /*istanbul ignore next */
    if (this.bounceToken.saveTo.toLowerCase() === 'user') {
      Model.AppUser.findOneAsync({
        _id: this._bounceToken.saveId,
        application: this._bounceToken.application,
        environment: this._bounceToken.environment
      }).then(function (appUser) {
        appUser.meta.authToken = this._bounceToken.key;
        appUser.markModified('meta');
        return appUser.saveAsync();
      });
    }
  }
  /*istanbul ignore else */
  if (this._bounceToken.returnUrl) {
    this._reply.redirect(this._bounceToken.returnUrl)
      .state('bouncer-token', this._bounceToken.toObject());
  } else {
    this._reply.view('done').state('bouncer-token', this._bounceToken.toObject());
  }
};
Bounce.prototype.delete = function (key, callback) {
  delete this._bounceToken.state[key];
  this._bounceToken.markModified('state');
  return this._bounceToken.saveAsync().bind(this).then(function () {
    return this;
  }).nodeify(callback);
};
Bounce.prototype.redirect = function (url) {
  this._reply.redirect(url).state('bouncer-token', this._bounceToken.toObject());
};

function StateController() {
  BaseController.apply(this, arguments);
}

util.inherits(StateController, BaseController);

StateController.prototype.bounce = function (request, reply) {

  BBPromise.try(function () {
    var key = request.params.key || request.state['bouncer-token'].key;
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
