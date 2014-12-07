'use strict';
var RedirectController = require('../../../lib/controllers/redirect_controller');
var sinon = require('sinon');
var expect = require('chai').expect;

describe('RedirectController', function () {
  describe('#initRoutes', function () {
    var server = {
      route: sinon.stub()

    };
    before(function () {
      RedirectController.initRoutes(server);
    });
    it('registers initateBounce', function () {
      return expect(server.route)
        .to.be.calledWith({
          handler: RedirectController.initiateBounce,
          path: '/initiate/{key}',
          method: 'GET'
        });
    });
  });
  describe('#initiateBounce', function () {
    var response = {
      redirect:sinon.stub()
    };
    var request = {};
    before(function () {
      RedirectController.initiateBounce(request, response);
    });
    it('redirects user',function(){
      return expect(response.redirect)
      .to.have.been.called;
    });
  });
});
