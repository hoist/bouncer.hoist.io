'use strict';
var RedirectController = require('../controllers/redirect_controller');
var StateController = require('../controllers/state_controller');
var HealthCheckController = require('../controllers/health_check_controller');
var ConfigureController = require('../controllers/configure_controller');

function Router() {

}

Router.prototype.init = function (server) {
  HealthCheckController.initRoutes(server);
  RedirectController.initRoutes(server);
  StateController.initRoutes(server);
  //InfoController.initRoutes(server);
  ConfigureController.initRoutes(server);
};

module.exports = new Router();
