'use strict';
var Hapi = require('hapi');
var config = require('config');
var router = require('./routes');
var Model = require('@hoist/model');
var logger = require('@hoist/logger');
var _ = require('lodash');
var handlebars = require('handlebars');
var bluebird = require('bluebird');
bluebird.promisifyAll(Model._mongoose);

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
  bluebird.promisifyAll(server);
  return server;
};
BouncerServer.prototype.start = function () {
  this.server = this.getServer();
  return this.server.startAsync().then(function () {
    return Model._mongoose.connectAsync(config.get('Hoist.mongo.core.connectionString'));
  });
};

BouncerServer.prototype.end = function () {
  return this.server.stopAsync()
    .then(_.bind(function () {
      return Model._mongoose.disconnectAsync()
        .then(_.bind(function () {
          delete this.server;
          logger.info('server stopped');
        }, this));
    }, this));
};


module.exports = new BouncerServer();
