'use strict';
var Hapi = require('hapi');
var config = require('config');
var router = require('./routes');
var Model = require('@hoist/model');
var logger = require('@hoist/logger');
var _ = require('lodash');
var handlebars = require('handlebars');

function BouncerServer() {

}
BouncerServer.prototype.getServer = function () {
  var server = new Hapi.Server();
  server.connection({
    host: config.get('Hoist.http.host'),
    port: config.get('Hoist.http.port')
  });
  server.views({
    engines: {
      handlebars: handlebars
    },
    isCached: true,
    relativeTo: __dirname,
    path: './views',
    layout: false
  });

  server.state('bouncer-token', {
    encoding: 'iron',
    password: config.get('Hoist.cookies.bouncer.password'),
    isSecure: config.get('Hoist.cookies.bouncer.secure'),
    isHttpOnly: true,
    domain: config.get('Hoist.domains.bouncer'),
    autoValue: {},
    path: '/'
  });
  router.init(server);
  return server;
};
BouncerServer.prototype.start = function (done) {
  this.server = this.getServer();
  this.server.start(function () {
    Model._mongoose.connect(config.get('Hoist.mongo.core.connectionString'), function () {
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
