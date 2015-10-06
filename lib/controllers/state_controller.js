'use strict';
var BaseController = require('./base_controller');
var util = require('util');
var connectorModule = require('../modules/connector_module');
var BBPromise = require('bluebird');
var errors = require('@hoist/errors');
var Model = require('@hoist/model');
var _ = require('lodash');
var logger = require('@hoist/logger');
var url = require('url');

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
Bounce.prototype.setDisplayProperty = function(name, value, callback) {
  var existingProperty = _.where(this._bounceToken.displayProperties, {name: name});
  if(existingProperty.length !== 0) {
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
Bounce.prototype.done = function (err) {
  /* istanbul ignore next */
  BBPromise.try(function () {
    if (this._bounceToken.saveTo && this._bounceToken.saveId) {
      /*istanbul ignore next */
      if (this._bounceToken.saveTo.toLowerCase() === 'bucket') {
        return Model.Bucket.findOneAsync({
          _id: this._bounceToken.saveId,
          application: this._bounceToken.application,
          environment: this._bounceToken.environment
        }).bind(this).then(function (bucket) {
          if (!bucket.meta.authToken) {
            bucket.meta.authToken = {};
          }
          bucket.meta.authToken[this._bounceToken.connectorKey] = this._bounceToken.key;
          bucket.markModified('meta');
          return bucket.saveAsync();
        });
      }
      /*istanbul ignore next */
      else if (this._bounceToken.saveTo.toLowerCase() === 'user') {
        return Model.AppUser.findOneAsync({
          _id: this._bounceToken.saveId,
          application: this._bounceToken.application,
          environment: this._bounceToken.environment
        }).bind(this).then(function (appUser) {
          appUser.meta.authToken = this._bounceToken.key;
          appUser.markModified('meta');
          return appUser.saveAsync();
        });
      }
    }
  }, [], this).bind(this).then(function () {
    if (this._bounceToken.returnUrl) {
      new Model.ExecutionLogEvent({
        application: this._bounceToken.application,
        environment: 'live',
        message: 'redirecting back to application for token:' + this._bounceToken.key,
        type: 'LOG'
      }).saveAsync().catch(function (err) {
        logger.error(err);
        logger.alert(err);
      });
      if (this._bounceToken.saveTo && this._bounceToken.saveId) {
        this._reply.redirect(this._bounceToken.returnUrl)
          .state('bouncer-token', this._bounceToken.toObject());
      } else {
        var _url = url.parse(this._bounceToken.returnUrl, true);
        _url.query.token = this._bounceToken.key;
        delete _url.search;
        this._reply.redirect(url.format(_url))
          .state('bouncer-token', this._bounceToken.toObject());
      }
    } else {
      var error;
      if (err) {
        if (err.stack) {
          error = err.stack;
        } else if (err.message) {
          error = err.message;
        } else {
          error = err;
        }
      }
      var options = {
        connectorType: this._bounceToken.connectorType,
        error: error
      };
      /* Only attach the token to the page if they didn't save
         to a bucket or a user */
      if (!this._bounceToken.saveTo) {
        options.token = this._bounceToken.key;
      }
      this._reply.view('done', options).state('bouncer-token', this._bounceToken.toObject());
    }
  }).catch(function (err) {
    logger.error(err);
    logger.alert(err);
    this._reply.view('done', {
      error: err.stack
    });
  });
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
    logger.info({
      params: request.params.key,
      state: request.state
    });
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
    new Model.ExecutionLogEvent({
      application: token._id,
      environment: 'live',
      message: 'Bounce recieved for ' + token.key,
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
