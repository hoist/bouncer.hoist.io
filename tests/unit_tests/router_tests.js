'use strict';
require('../bootstrap');
var router = require('../../lib/routes');
var RedirectController = require('../../lib/controllers/redirect_controller');
var StateController = require('../../lib/controllers/state_controller');
var HealthCheckController = require('../../lib/controllers/health_check_controller');
var ConfigureController = require('../../lib/controllers/configure_controller');
var sinon = require('sinon');
var expect = require('chai').expect;

describe('Router', function () {
  describe('#init', function () {
    var server = {

    };
    before(function () {
      sinon.stub(RedirectController, 'initRoutes');
      sinon.stub(StateController, 'initRoutes');
      sinon.stub(HealthCheckController, 'initRoutes');
      sinon.stub(ConfigureController, 'initRoutes');
      router.init(server);
    });
    after(function () {
      RedirectController.initRoutes.restore();
      StateController.initRoutes.restore();
      HealthCheckController.initRoutes.restore();
      ConfigureController.initRoutes.restore();
    });
    it('sets up RedirectController routes', function () {
      return expect(RedirectController.initRoutes)
        .to.have.been.called;
    });
    it('sets up StateController routes', function () {
      return expect(StateController.initRoutes)
        .to.have.been.called;
    });
    it('sets up HealthCheckController routes', function () {
      return expect(HealthCheckController.initRoutes)
        .to.have.been.called;
    });
    it('sets up ConfigureController routes', function () {
      return expect(ConfigureController.initRoutes)
        .to.have.been.called;
    });

  });
});
