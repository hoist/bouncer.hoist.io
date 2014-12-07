'use strict';
var RedirectController = require('../controllers/redirect_controller');

function Router() {

}

Router.prototype.init = function (server) {
  RedirectController.initRoutes(server);
};

module.exports = new Router();
