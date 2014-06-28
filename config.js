/* global exports, process, require */
/* jshint unused: false */

var config = exports
  , system = null
  , env    = null
  , sugar  = null;

try {
    system = require('system');
    env = system.env;
} catch (ex) {
    env = process.env;
    sugar = require('sugar');
}
    
function getEnv(value, defaultValue) {
    return (typeof value !== 'undefined' && value !== '') ? value : defaultValue;
}

// GOD
config.GOD_ADDRESS = getEnv(env.GOD_ADDRESS, "http://127.0.0.1");
config.GOD_BACK_CHANNEL_PORT = getEnv(env.GOD_BACK_CHANNEL_PORT, 3000);

// SEPHARM TODO its seraph singular and seraphim plural ! 
config.SEPHARM_ADDRESS = getEnv(env.SEPHARM_ADDRESS, "127.0.0.1");
config.SEPHARM_PORT = getEnv(env.SEPHARM_PORT, 8421);

config.ANGEL_START_PORT = getEnv(env.ANGEL_START_PORT, 55550);
config.ANGEL_PORT_COUNT = getEnv(env.ANGEL_PORT_COUNT, 5);
try {
    config.ANGEL_PORTS = Number.range(config.ANGEL_START_PORT, config.ANGEL_START_PORT + config.ANGEL_PORT_COUNT - 1).every();
} catch (ex) {
}