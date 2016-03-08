'use strict';

var gulp = require('gulp'),
  path = require('path'),
  nutil = require('util'),
  combine = require('stream-combiner'),
  pkg = require('./package.json'),
  chalk = require('chalk'),
  fs = require('fs'),
  concat = require('gulp-concat-util'),
  runSequence = require('run-sequence'),
  protractor = require('gulp-protractor').protractor,
  webdriver = require('gulp-protractor').webdriver_standalone,
  webdriver_update = require('gulp-protractor').webdriver_update,
  sauceCreds = require('./config/protractor/creds.js'),
  baseUrl = require('yargs').argv.baseUrl || 'http://localhost:9003',
  src = {
    cwd: 'src',
    dist: 'dist_temp',
    scripts: '*/*.js',
    less: ['modules.less'],
    index: 'module.js',
    templates: ['*/*.tpl.html', '*/*.html'],
    docView: '*/docs/*.view.html',
    html: ['src/**/*.html', 'docs/**/*.html'],
    js: ['src/**/*.js', 'docs/**/*.js', '!src/**/test/*.*'],
    watch: ['src/**/*.*','!src/**/docs/*.*', '!src/**/test/*.*']
  },
  banner,
  createModuleName;

require('matchdep')
  .filterDev('gulp-*')
  .forEach(function(module) {
    global[module.replace(/^gulp-/, '')] = require(module);
  });

banner = util.template('/**\n' +
  ' * <%= pkg.name %>\n' +
  ' * @version v<%= pkg.version %> - <%= today %>\n' +
  ' * @link <%= pkg.homepage %>\n' +
  ' * @author <%= pkg.author.name %> (<%= pkg.author.email %>)\n' +
  ' * @license MIT License, http://www.opensource.org/licenses/MIT\n' +
  ' */\n', {file: '', pkg: pkg, today: new Date().toISOString().substr(0, 10)});

// ========== CLEAN ========== //
gulp.task('clean:dist', function() {
  return gulp.src([src.dist + '/*'], {read: false})
    .pipe(clean())
    .on('error', util.log);
});

// ========== SCRIPTS ========== //
gulp.task('scripts:dist', function(foo) {

  var combined = combine(
    // Build unified package
    gulp.src([src.index, src.scripts], {cwd: src.cwd})
      .pipe(ngmin())
      .pipe(concat(pkg.name + '.js', {process: function(src) { return '// Source: ' + path.basename(this.path) + '\n' + (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
      .pipe(concat.header('(function(window, document, undefined) {\n\'use strict\';\n'))
      .pipe(concat.footer('\n})(window, document);\n'))
      .pipe(concat.header(banner))
      .pipe(gulp.dest(src.dist))
      .pipe(rename(function(path) { path.extname = '.min.js'; }))
      .pipe(uglify())
      .pipe(concat.header(banner))
      .pipe(gulp.dest(src.dist))
  );

  combined.on('error', function(err) {
    util.log(chalk.red(nutil.format('Plugin error: %s', err.message)));
  });

  return combined;

});


// ========== TEMPLATES ========== //
createModuleName = function(src) { return 'adaptv.adaptStrap.' + src.split(path.sep)[0]; };
gulp.task('templates:dist', function() {

  var combined = combine(

    // Build unified package
    gulp.src(src.templates, {cwd: src.cwd})
      .pipe(htmlmin({removeComments: true, collapseWhitespace: true}))
      .pipe(ngtemplate({module: createModuleName}))
      .pipe(ngmin())
      .pipe(concat(pkg.name + '.tpl.js', {process: function(src) { return '// Source: ' + path.basename(this.path) + '\n' + (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
      .pipe(concat.header('(function(window, document, undefined) {\n\'use strict\';\n\n'))
      .pipe(concat.footer('\n\n})(window, document);\n'))
      .pipe(concat.header(banner))
      .pipe(gulp.dest(src.dist))
      .pipe(rename(function(path) { path.extname = '.min.js'; }))
      .pipe(uglify())
      .pipe(concat.header(banner))
      .pipe(gulp.dest(src.dist)).on('error', function(err) {
        util.log(chalk.red(nutil.format('Plugin error: %s', err.message)));
      })
  );

  combined.on('error', function(err) {
    util.log(chalk.red(nutil.format('Plugin error: %s', err.message)));
  });

  return combined;

});

// ========== STYLE ========== //
gulp.task('less', function () {
  return gulp.src(paths.mainLess)
    .pipe(less())
    .on('error', nutil.log)
    .pipe(gulp.dest('app'))
    .on('error', nutil.log)
    .pipe(connect.reload())
    .on('error', nutil.log);
});

gulp.task('style:dist', function() {
  return gulp.src(src.less, {cwd: src.cwd})
    .pipe(less())
    .pipe(concat(pkg.name + '.css', {process: function(src) { return '/* Style: ' + path.basename(this.path) + '*/\n' + (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
    .pipe(concat.header(banner))
    .pipe(gulp.dest(src.dist))
    .pipe(cssmin())
    .pipe(concat.header(banner))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(src.dist))
    .on('error', function(err) {
      util.log(chalk.red(nutil.format('Plugin error: %s', err.message)));
    });
});

gulp.task('style:dist:live', function() {
  return gulp.src(src.less, {cwd: src.cwd})
    .pipe(less())
    .on('error', nutil.log)
    .pipe(concat(pkg.name + '.css', {process: function(src) { return '/* Style: ' + path.basename(this.path) + '*/\n' + (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
    .on('error', nutil.log)
    .pipe(concat.header(banner))
    .on('error', nutil.log)
    .pipe(gulp.dest(src.dist))
    .on('error', nutil.log)
    .pipe(cssmin())
    .on('error', nutil.log)
    .pipe(concat.header(banner))
    .on('error', nutil.log)
    .pipe(rename({suffix: '.min'}))
    .on('error', nutil.log)
    .pipe(gulp.dest(src.dist))
    .on('error', nutil.log)
    .pipe(connect.reload())
    .on('error', nutil.log)
});

// ========== validate ========== //
gulp.task('htmlhint', function () {
  gulp.src(src.html)
    .pipe(htmlhint({
      htmlhintrc: '.htmlhintrc'
    }))
    .pipe(htmlhint.reporter());
});

gulp.task('htmlhint:fail', function () {
  gulp.src(src.html)
    .pipe(htmlhint({
      htmlhintrc: '.htmlhintrc'
    }))
    .pipe(htmlhint.failReporter());
});

gulp.task('jshint', function() {
  gulp.src(src.js)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('jshint:fail', function() {
  gulp.src(src.js)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('jscs', function () {
  return gulp.src(src.js)
    .pipe(jscs());
});

gulp.task('unit', function() {
  return gulp.src('./nothing')
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }));
});

gulp.task('unit:travis', function() {
  return gulp.src('./nothing')
    .pipe(karma({
      configFile: 'karma.conf.js',
      reporters: ['dots', 'coverage'],
      action: 'run',
      singleRun: true
    }));
});

// ========== DEFAULT TASKS ========== //
gulp.task('dist', function(callback) {
  runSequence(['jshint:fail', 'htmlhint:fail'],'clean:dist', ['templates:dist', 'scripts:dist', 'style:dist'], callback);
});

gulp.task('dist:release', function(callback) {
  src.dist = 'dist';
  runSequence(['jshint:fail', 'htmlhint:fail'],'clean:dist', ['templates:dist', 'scripts:dist', 'style:dist'], callback);
});


gulp.task('dist:unsafe', function(callback) {
  runSequence('clean:dist', ['templates:dist', 'scripts:dist', 'style:dist:live'], callback);
  return 0;
});

gulp.task('watch', function () {
  gulp.watch(src.watch, ['dist:unsafe'])
    .on('error', util.log);
});

gulp.task('server', function () {
  return connect.server({
    root: '',
    port: 9003,
    livereload: true
  });
});

gulp.task('webdriver_update', webdriver_update);
gulp.task('webdriver', webdriver);

gulp.task('e2e', function() {
  runSequence('server');
  return gulp.src(['./nothing'])
    .pipe(protractor({
      configFile: 'config/protractor/local.conf.js',
      keepAlive: true,
      args: ['--baseUrl', baseUrl]
    }))
    .on('end', function() {
      console.log('E2E Testing complete');
      process.exit();
    })
    .on('error', function(error) {
      console.log('E2E Tests failed');
      process.exit(1);
    });
});

var sauceConnectLauncher = require('sauce-connect-launcher');

gulp.task('e2e_sauce', function() {
  sauceConnectLauncher({
    username: sauceCreds.sauceUser,
    accessKey: sauceCreds.sauceKey
  }, function (err, sauceConnectProcess) {
    if (err) {
      console.error(err.message);
      return;
    }
    console.log("connection ready");
    runSequence('server');

    gulp.src(['./nothing'])
      .pipe(protractor({
        configFile: 'config/protractor/qa.conf.js',
        keepAlive: true,
        args: ['--baseUrl', baseUrl]
      }))
      .on('end', function() {
        console.log('E2E Testing complete');
        sauceConnectProcess.close(function () {
          console.log("Closed Sauce Connect process");
        });
        process.exit();
      })
      .on('error', function(error) {
        console.log('E2E Tests failed');
        sauceConnectProcess.close(function () {
          console.log("Closed Sauce Connect process");
        });
        process.exit(1);
      });
  });
});

gulp.task('validate', ['jshint', 'jscs', 'htmlhint']);
gulp.task('validate:fail', ['jshint:fail', 'jscs', 'htmlhint:fail']);

gulp.task('default', function(callback) {
  return runSequence('server','dist:unsafe', 'watch', callback);
});
