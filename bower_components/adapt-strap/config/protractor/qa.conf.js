var browsers = require('./browsers'),
  creds = require('./creds');

// ================ config =============== //
var config = {
  specs: [
    '../../src/**/test/*.e2e.js'
  ],

  baseUrl: 'http://localhost:9003',
  seleniumAddress: 'http://kashyap02004:bd275167-7597-486c-b117-42707e46fc49@ondemand.saucelabs.com:80/wd/hub',
  allScriptsTimeout: 60000,
  getPageTimeout: 60000,
  jasmineNodeOpts: {
    showColors: true,
    isVerbose: true,
    includeStackTrace: true,
    defaultTimeoutInterval: 300000
  }
};

config.sauceUser = process.env.SAUCE_USERNAME || creds.sauceUser;
config.sauceKey = process.env.SAUCE_ACCESS_KEY || creds.sauceKey;

config.multiCapabilities = [
  browsers.chrome,
  browsers.safari,
  browsers.firefox
];

exports.config = config;