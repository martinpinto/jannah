var Utils = {};
try {
  if (module) {
    Utils = module.exports;
  }
} catch (ex) {}

function getHostName(url) {
  url = url.split('//');
  if (url.length === 1) {
    return url[0];
  }
  return url[1].split('/')[0];
}

Utils.getSitename = function (url) {
  var x = getHostName(url).split('.'),
    tld = x.pop(),
    host = x.pop();
  return host + '.' + tld;
};

try {
  if (!module) {
    exports.Utils = Utils;
  }
} catch (ex) {}