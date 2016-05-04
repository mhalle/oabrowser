const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

gulp.task('default', () => {
	return gulp.src(['libs/**/*.js','hierarchyGroup.js', 'angularInit.js', 'ng-providers/**/*.js','ng-directives/**/*.js','ng-controllers/**/*.js', 'app.js'])
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ['es2015']
		}))
		.pipe(concat('all.js'))
        .pipe(uglify())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist'));
});
