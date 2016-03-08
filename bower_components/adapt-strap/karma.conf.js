// Karma configuration
// Generated on Thu Mar 06 2014 13:17:21 GMT-0500 (Eastern Standard Time)

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      'karma-jasmine',
      'karma-phantomjs-launcher',
      'karma-ng-html2js-preprocessor',
      'karma-junit-reporter',
      'karma-coverage'
    ],
    files: [
      'bower_components/jquery/dist/jquery.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/showdown/src/showdown.js',
      'bower_components/bootstrap/dist/js/bootstrap.min.js',
      'docs/app.js',
      'src/module.js',
      'src/**/*.js',
      'src/**/*.html',
      'docs/**/*.js',
      'docs/**/*.html'
    ],
    exclude: [
      '**/gulpfile.js',
      'src/**/*.e2e.js'
    ],
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress', 'coverage'],
    preprocessors: {
      'src/**/!(*.test).js': 'coverage',
      '!src/**/test/*.js': 'coverage',
      '!src/**/(*.e2e).js': 'coverage',
      'src/**/*.html': 'ng-html2js'
    },
    ngHtml2JsPreprocessor: {
      moduleName: 'dir-templates',
      cacheIdFromPath: function(filepath) {
        // Excluding docs directory while stripping /src
        if (filepath.indexOf('/docs/') === -1) {
          filepath = filepath.split('src/').pop();
        }
        return filepath;
      }
    },
    junitReporter: {
      outputFile: 'coverage/test-results.xml',
      suite: ''
    },
    coverageReporter: {
      reporters:[
        {type: 'lcov', dir:'coverage/'},
        {type: 'text-summary', dir:'coverage/'}
      ]
    },
    // web server port
    port: 9876,
    // enable / disable colors in the output (reporters and logs)
    colors: true,
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,
    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['PhantomJS'],
    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 10000,
    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true
  });
};
