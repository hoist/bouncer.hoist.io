'use strict';
var Hapi = require('hapi');
var config = require('config');
var router = require('./routes');
var Model = require('hoist-model');
var logger = require('hoist-logger');
var _ = require('lodash');

function BouncerServer() {

}
BouncerServer.prototype.getServer = function () {
  var server = new Hapi.Server(config.get('Hoist.http.port'));
  server.state('bouncer-token', {
    encoding: 'iron',
    password: config.get('Hoist.session.key'),
    isSecure: config.get('Hoist.cookies.secure'),
    isHttpOnly: config.get('Hoist.cookies.httpOnly'),
    domain: config.get('Hoist.cookies.domain')
  });
  router.init(server);
  return server;
};
BouncerServer.prototype.start = function (done) {
  this.server = this.getServer();
  this.server.start(function () {
    Model._mongoose.connect(function () {
      logger.info('server running');
      done();
    });
  });
};

BouncerServer.prototype.end = function (done) {
  this.server.stop(_.bind(function () {
    Model._mongoose.disconnect(_.bind(function () {
      delete this.server;
      logger.info('server stopped');
      done();
    }, this));
  }, this));
};


module.exports = new BouncerServer();
