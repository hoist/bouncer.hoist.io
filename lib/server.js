'use strict';
var Hapi = require('hapi');
var config = require('config');
var router = require('./routes');
var Model = require('hoist-model');
var _ = require('lodash');

function BouncerServer() {

}
BouncerServer.prototype.getServer = function () {
  var server = new Hapi.Server(config.get('Hoist.http.port'));
  router.init(server);
  return server;
};
BouncerServer.prototype.start = function (done) {
  this.server = this.getServer();
  this.server.start(function () {
    Model._mongoose.connect(function () {
      console.log('server running');
      done();
    });
  });
};

BouncerServer.prototype.end = function (done) {
  this.server.stop(_.bind(function () {
    Model._mongoose.disconnect(_.bind(function () {
      delete this.server;
      console.log('server stopped');
      done();
    }, this));
  }, this));
};


module.exports = new BouncerServer();
