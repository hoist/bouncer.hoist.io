'use strict';
var BaseController = require('./base_controller');
var util = require('util');

function RedirectController() {

}

util.inherits(RedirectController, BaseController);

RedirectController.prototype.initiateBounce = function (request, reply) {
  reply.redirect('');
};

RedirectController.prototype.initRoutes = function (server) {
  server.route({
    method: 'GET',
    path: '/initiate/{key}',
    handler: this.initiateBounce
  });
};

module.exports = new RedirectController();
