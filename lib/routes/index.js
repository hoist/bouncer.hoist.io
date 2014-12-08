'use strict';
var RedirectController = require('../controllers/redirect_controller');
var StateController = require('../controllers/state_controller');
function Router() {

}

Router.prototype.init = function (server) {
  RedirectController.initRoutes(server);
  StateController.initRoutes(server);
};

module.exports = new Router();
