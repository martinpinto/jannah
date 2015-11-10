"use strict";

let winston = require('winston');

require('winston-papertrail').Papertrail;

function Logger() {
  return this._setup();
};

module.exports = Logger;

Logger.prototype._setup = function() {
  let self = this,
    logger = new (winston.Logger)({
      transports : [new (winston.transports.Console)({
        timestamp : true,
        colorize  : true,
        prettyPrint : true
      })]
    });

  if(process.env.PAPERTRAIL_PORT && process.env.PAPERTRAIL_HOST) {
    logger.add(winston.transports.Papertrail, {
      host: process.env.PAPERTRAIL_HOST,
      port: process.env.PAPERTRAIL_PORT
    });

    logger.handleExceptions(new winston.transports.Papertrail({
      host: process.env.PAPERTRAIL_HOST,
      port: process.env.PAPERTRAIL_PORT
    }));
  } else {
    logger.handleExceptions(new winston.transports.Console({
      timestamp : true,
      colorize  : true
    }));
  }

  return logger;
};
