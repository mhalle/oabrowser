var browsers = require('./browsers');

// ================ config =============== //
var config = {
  specs: [
    '../../src/**/test/*.e2e.js'
  ],

  baseUrl: 'http://localhost:9003/#',
  allScriptsTimeout: 30000,
  getPageTimeout: 30000,
  jasmineNodeOpts: {
    showColors: true,
    isVerbose: true,
    includeStackTrace: true,
    defaultTimeoutInterval: 300000
  }
};

config.multiCapabilities = [
  browsers.chrome
];

exports.config = config;