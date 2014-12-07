'use strict';
//var ConnectorModule = require('../modules/connector_module');
function BaseController(){

}

BaseController.prototype.initRoutes = function(){
  //override in subclasses
  //var key = request.params.key;
  //ConnectorModule.findModule()
};


module.exports = BaseController;
