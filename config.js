var config = {},
  system = null,
  env = null,
  sugar = null;

try {
  if (module) {
    config = module.exports;
  }
} catch (ex) {}


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
config.DEFAULT_IP = '127.0.0.1';

config.MASTER_ADDRESS = getEnv(env.MASTER_ADDRESS, config.DEFAULT_IP);
config.MASTER_PORT = getEnv(env.MASTER_PORT, 7331);
config.MASTER_BACK_CHANNEL_PORT = getEnv(env.MASTER_BACK_CHANNEL_PORT, 3000);

config.HUB_PORT = getEnv(env.HUB_PORT, 8421);
config.HUB_CONFIG_PATH = getEnv(env.HUB_CONFIG_PATH, './hubConfig.json');
config.TAB_START_PORT = getEnv(env.TAB_START_PORT, 55550);
config.TAB_PORT_COUNT = getEnv(env.TAB_PORT_COUNT, 5);
try {
  config.TAB_PORTS = Number.range(config.TAB_START_PORT, config.TAB_START_PORT + config.TAB_PORT_COUNT - 1).every();
} catch (ex) {}


try {
  if (!module) {
    exports.config = config;
  }
} catch (ex) {}