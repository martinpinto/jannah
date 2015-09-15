var toml = require('toml-require').install(),
  data = require('./config.toml');

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
config.DEFAULT_IP = data.default_ip;
config.MASTER_ADDRESS = getEnv(env.MASTER_ADDRESS, config.DEFAULT_IP);
config.MASTER_PORT = getEnv(env.MASTER_PORT, data.master.port);
config.MASTER_BACK_CHANNEL_PORT = getEnv(env.MASTER_BACK_CHANNEL_PORT, data.master.back_channel_port);

config.HUB_PORT = getEnv(env.HUB_PORT, data.hub.port);
config.HUB_CONFIG_PATH = getEnv(env.HUB_CONFIG_PATH, data.hub.config_path);
config.TAB_START_PORT = getEnv(env.TAB_START_PORT, data.tab.start_port);
config.TAB_PORT_COUNT = getEnv(env.TAB_PORT_COUNT, data.tab.port_count);
try {
  config.TAB_PORTS = Number.range(config.TAB_START_PORT, config.TAB_START_PORT + config.TAB_PORT_COUNT - 1).every();
} catch (ex) {}


try {
  if (!module) {
    exports.config = config;
  }
} catch (ex) {}
