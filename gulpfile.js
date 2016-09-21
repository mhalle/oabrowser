const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const clean = require('gulp-clean');
const templateCache = require('gulp-angular-templatecache');
const concatCss = require('gulp-concat-css');

const filesList = [
        "bower_components/jquery/dist/jquery.js",
        "bower_components/limit.js/limit.js",
        "bower_components/inobounce/inobounce.min.js",
        "bower_components/urijs/src/URI.min.js",
        "bower_components/angular/angular.js",
        "bower_components/angular-sanitize/angular-sanitize.js",
        "bower_components/bootstrap/dist/js/bootstrap.js",
        "bower_components/angular-animate/angular-animate.min.js",
        "bower_components/adapt-strap/dist/adapt-strap.min.js",
        "bower_components/adapt-strap/dist/adapt-strap.tpl.min.js",
        "bower_components/firebase/firebase.js",
        "bower_components/angularfire/dist/angularfire.min.js",
        "bower_components/angular-ui-layout/src/ui-layout.js",
        "bower_components/angularjs-slider/dist/rzslider.min.js",
        "bower_components/moment/min/moment-with-locales.min.js",
        "bower_components/zlib.js/bin/zlib_and_gzip.min.js",
        "bower_components/dat.gui/dat.gui.min.js",
        "bower_components/tween.js/src/Tween.js",
        "bower_components/three.js/build/three.min.js",
        "bower_components/three.js/examples/js/controls/TrackballControls.js",
        "bower_components/three.js/examples/js/libs/stats.min.js",
        "bower_components/three.js/examples/js/loaders/VTKLoader.js",
        "bower_components/three.js/examples/js/Detector.js",
        "bower_components/three.js/examples/js/loaders/NRRDLoader.js",
        "libs/jquery.mousewheel.js",
        "libs/ui-bootstrap-tpls-1.3.1.min.js",
        "libs/ng-tags/ng-tags-input.min.js",
        "libs/MTLLoader.js",
        "libs/OBJLoader.js",
        "babel/angularInit.js",
        "babel/mainAppProvider.js",
        "babel/atlasJsonProvider.js",
        "babel/objectSelectorProvider.js",
        "babel/volumesManagerProvider.js",
        "babel/loadingManagerProvider.js",
        "babel/crosshairProvider.js",
        "babel/screenshotSceneProvider.js",
        "babel/undoRedoManagerService.js",
        "babel/firebaseViewService.js",
        "babel/toArrayFilter.js",
        "babel/compileDirective.js",
        "babel/insertTreeDirective.js",
        "babel/insertBreadcrumbs.js",
        "babel/insertSliceDirective.js",
        "babel/bookmarksDirective.js",
        "babel/messagesDirective.js",
        "babel/mainToolbarDirective.js",
        "babel/sceneCrosshairDirective.js",
        "babel/confirmationModalDirective.js",
        "babel/layoutController.js",
        "babel/modalController.js",
        "babel/headerController.js",
        "babel/loginModalController.js",
        "babel/Volume.js",
        "babel/VolumeSlice.js",
        "babel/MultiVolumesSlice.js",
        "babel/LightKit.js",
        "babel/hierarchyGroup.js",
        "babel/app.js",
        "tmp/templates.js"
    ];

const babelFiles = [
        "angularInit.js",
        "ng-providers/mainAppProvider.js",
        "ng-providers/atlasJsonProvider.js",
        "ng-providers/objectSelectorProvider.js",
        "ng-providers/volumesManagerProvider.js",
        "ng-providers/loadingManagerProvider.js",
        "ng-providers/crosshairProvider.js",
        "ng-providers/screenshotSceneProvider.js",
        "ng-providers/undoRedoManagerService.js",
        "ng-providers/firebaseViewService.js",
        "ng-filters/toArrayFilter.js",
        "ng-directives/compileDirective.js",
        "ng-directives/insertTreeDirective.js",
        "ng-directives/insertBreadcrumbs.js",
        "ng-directives/insertSliceDirective.js",
        "ng-directives/bookmarksDirective.js",
        "ng-directives/messagesDirective.js",
        "ng-directives/mainToolbarDirective.js",
        "ng-directives/sceneCrosshairDirective.js",
        "ng-directives/confirmationModalDirective.js",
        "ng-controllers/layoutController.js",
        "ng-controllers/modalController.js",
        "ng-controllers/headerController.js",
        "ng-controllers/loginModalController.js",
        "libs/Volume.js",
        "libs/VolumeSlice.js",
        "libs/MultiVolumesSlice.js",
        "libs/LightKit.js",
        "hierarchyGroup.js",
        "app.js"
    ];

const styleList = [
    "bower_components/bootstrap/dist/css/bootstrap.css",
    "libs/font-awesome/css/font-awesome.min.css",
    "bower_components/adapt-strap/dist/adapt-strap.min.css",
    "bower_components/angular-ui-layout/src/ui-layout.css",
    "bower_components/angularjs-slider/dist/rzslicer.min.css",
    "libs/ng-tags/ng-tags-input.min.css",
    "libs/ng-tags/ng-tags-input.bootstrap.min.css",
    "style.css"
];

gulp.task('babel', () => {
	return gulp.src(babelFiles)
		.pipe(babel({
			presets: ['es2015']
		}))
		.pipe(gulp.dest('babel'));
});

gulp.task('templates', function () {
  return gulp.src('ng-templates/**/*.html')
    .pipe(templateCache('templates.js', {
      root : 'ng-templates',
      module : 'atlasDemo'
  }))
    .pipe(gulp.dest('tmp'));
});

gulp.task('styles', () => {
    return gulp.src(styleList)
        .pipe(concatCss('allstyles.css', {rebaseUrls: false}))
        .pipe(gulp.dest('dist'));
});

gulp.task('build', ['babel', 'templates', 'styles'], () => {
	return gulp.src(filesList)
		.pipe(sourcemaps.init())
		.pipe(concat('all.js'))
        .pipe(uglify())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist'));
});

gulp.task('clean', ['babel', 'templates', 'styles', 'build'], function () {
	return gulp.src(['babel','tmp'], {read: false})
		.pipe(clean());
});

gulp.task('default', ['babel', 'templates', 'styles', 'build', 'clean'],function () {

});
