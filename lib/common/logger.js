var winston = require('winston');

var Logger = module.exports = function(debug) {
  this.debug = debug;
  return this._setup();
};

Logger.prototype._setup = function() {
  var self = this;
  var _logger = null;
  if (self._debug === false) {
    _logger = new winston.Logger({
      transports: [
        new Papertrail({
          host: 'logs.papertrailapp.com',
          port: 38599
        })
      ]
    });
  } else {
    _logger = new(winston.Logger)({
      transports: [new winston.transports.Console()],
      exceptionHandlers: [new winston.transports.Console()]
    });
  }
  return _logger;
};
