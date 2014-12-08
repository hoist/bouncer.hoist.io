'use strict';
require('../../bootstrap');
var sinon = require('sinon');
var errors = require('hoist-errors');
var expect = require('chai').expect;

describe('BaseController', function () {
  var BaseController = require('../../../lib/controllers/base_controller');
  describe('#errorProcessor', function () {
    var response = {};
    var reply = sinon.stub().returns(response);
    var errorProcessor;
    before(function () {
      var baseController = new BaseController();
      errorProcessor = baseController.errorProcessor(reply);
    });
    describe('with hoist error', function () {
      before(function () {
        errorProcessor(new errors.model.NotFoundError('custom message'));
      });
      after(function () {
        delete response.statusCode;
        reply.reset();
      });
      it('sends hoist error message', function () {
        expect(reply).to.have.been.calledWith('custom message');
      });
      it('uses hoist error code', function () {
        expect(response.statusCode).to.eql(404);
      });
    });
    describe('with http error', function () {
      before(function () {
        errorProcessor(new errors.Http401Error('custom message'));
      });
      after(function () {
        delete response.statusCode;
        reply.reset();
      });
      it('sends hoist error message', function () {
        expect(reply).to.have.been.calledWith('custom message');
      });
      it('uses hoist error code', function () {
        expect(response.statusCode).to.eql('401');
      });
    });
    describe('with unexpected error', function () {
      before(function () {
        errorProcessor(new Error('custom message'));
      });
      after(function () {
        delete response.statusCode;
        reply.reset();
      });
      it('sends hoist error message', function () {
        expect(reply).to.have.been.calledWith('An unexpected HoistError occurred.');
      });
      it('uses hoist error code', function () {
        expect(response.statusCode).to.eql(500);
      });
    });
  });
});
