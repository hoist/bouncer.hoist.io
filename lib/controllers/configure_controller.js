'use strict';
var BaseController = require('./base_controller');
var util = require('util');
var connectorModule = require('../modules/connector_module');
var BBPromise = require('bluebird');
var errors = require('@hoist/errors');
var Model = require('@hoist/model');
var _ = require('lodash');
var logger = require('@hoist/logger');

function Bounce(request, reply, bounceToken) {
  _.bindAll(this);
  this._request = request;
  this._reply = reply;
  this._bounceToken = bounceToken;
  this.query = request.query;
  this.payload = request.payload;
  this.key = bounceToken.key;
}
Bounce.prototype.set = function (key, value, callback) {
  this._bounceToken.state[key] = value;
  this._bounceToken.markModified('state');
  return this._bounceToken.saveAsync().bind(this).then(function () {
    return this;
  }).nodeify(callback);
};
Bounce.prototype.setDisplayProperty = function (name, value, callback) {
  var existingProperty = _.filter(this._bounceToken.displayProperties, function (prop) {
    return prop.name.toLowerCase() === name.toLowerCase();
  });
  if (existingProperty.length !== 0) {
    existingProperty[0].value = value;
  } else {
    this._bounceToken.displayProperties.push({
      name: name,
      value: value
    });
  }
  return this._bounceToken.saveAsync().bind(this).then(function () {
    return this;
  }).nodeify(callback);
};
Bounce.prototype.get = function (key) {
  return this._bounceToken.state[key];
};
Bounce.prototype.done = function () {

};
Bounce.prototype.delete = function (key, callback) {
  delete this._bounceToken.state[key];
  this._bounceToken.markModified('state');
  return this._bounceToken.saveAsync().bind(this).then(function () {
    return this;
  }).nodeify(callback);
};

function ConfigureController() {
  BaseController.apply(this, arguments);
}

util.inherits(ConfigureController, BaseController);

ConfigureController.prototype.configure = function (request, reply) {
  BBPromise.try(function () {
    logger.info({
      params: request.params.key,
      state: request.state
    });
    var key = request.params.key;
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
    new Model.ExecutionLogEvent({
      application: token._id,
      environment: 'live',
      message: 'Configure recieved for ' + token.key,
      type: 'LOG'
    }).saveAsync().catch(function (err) {
      logger.error(err);
    });
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
          if (!connector.configure) {
            return reply({
              ok: true
            });
          }
          return connector.configure(bounce).then(function(){
            logger.info('finishing configure');
            return reply({
              ok: true
            });
          });
        });
    });
  }).catch(function (err) {
    logger.error(err);
    reply(err);
  });
};


ConfigureController.prototype.initRoutes = function (server) {
  server.route({
    method: 'POST',
    path: '/configure/{key}',
    handler: this.configure
  });
};

module.exports = new ConfigureController();
