'use strict';
require('../bootstrap');
var router = require('../../lib/routes');
var RedirectController = require('../../lib/controllers/redirect_controller');
var StateController = require('../../lib/controllers/state_controller');
var sinon = require('sinon');
var expect = require('chai').expect;

describe('Router', function () {
  describe('#init', function () {
    var server = {

    };
    before(function () {
      sinon.stub(RedirectController, 'initRoutes');
      sinon.stub(StateController,'initRoutes');
      router.init(server);
    });
    after(function () {
      RedirectController.initRoutes.restore();
      StateController.initRoutes.restore();
    });
    it('sets up RedirectController routes', function () {
      return expect(RedirectController.initRoutes)
        .to.have.been.called;
    });
    it('sets up StateController routes', function () {
      return expect(StateController.initRoutes)
      .to.have.been.called;
    });

  });
});
