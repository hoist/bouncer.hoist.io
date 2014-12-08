'use strict';
var logger = require('hoist-logger');
var server = require('./lib/server');


process.on('message', function (msg) {
  if (msg === 'shutdown') {
    console.log('closing connection');
    setTimeout(function () {
      console.log('shutting down git server');
      server.stop(function () {
        process.exit(0);
      });
    }, 500);
  }
});

server.start(function () {
  logger.info('server running');
});
