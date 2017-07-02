// Gulp and plugins
var gulp = require('gulp'),
    concat = require('gulp-concat'),
    closureCompiler = require('gulp-closure-compiler'),
    flatmap = require('gulp-flatmap'),
    jsdoc = require("gulp-jsdoc3"),
    jshint = require('gulp-jshint'),
    rename = require('gulp-rename'),
    rimraf = require('gulp-rimraf'),
    sass = require('gulp-sass'),
    testem = require('gulp-testem'),
    uglify = require('gulp-uglify'),
    util = require('gulp-util'),
    umd = require('gulp-umd');

// paths
var src = './src/',
    dist = './dist/',
    doc = './doc',
    distJs = dist + 'js',
    distCss = dist + 'css',
    distImg = dist + '/images',
    lib = './lib/',
    jsFiles = [src + 'js/' + 'HV.js',
        src + 'js/' + 'common/common.js',
        src + 'js/' + 'charts/hystrixCommand.js',
        src + 'js/' + 'charts/hystrixThreadPool.js'],
    scssFiles = [src + 'scss/' + 'monitor.scss',
        src + 'scss/' + 'hystrixCommand.scss',
        src + 'scss/' + 'hystrixThreadPool.scss'],
    imgFiles = [src + '/images/' + '*.*'];

gulp.task('default', ['jshint', 'build:js', 'build:css', 'copy:img']);

gulp.task('compile', ['jshint', 'compile:js', 'build:css', 'copy:img']);

// deletes the distribution directory
gulp.task('clean', function () {
    return gulp.src([dist + '*'], {read: false})
        .pipe(rimraf());
});

// create 'hystrixviewer.js' and 'hystrixviewer.min.js' from source js
gulp.task('build:js', ['clean'], function () {
    return gulp.src(jsFiles)
        .pipe(concat({path: 'hystrixviewer.js'}))
        .pipe(umd(
            {
                dependencies: function () {
                    return [{
                        name: 'jquery',
                        amd: 'jquery',
                        cjs: 'jquery',
                        global: 'jQuery',
                        param: '$'
                    },
                        {
                            name: 'd3',
                            amd: 'd3',
                            cjs: 'd3',
                            global: 'd3',
                            param: 'd3'
                        }];
                },
                exports: function () {
                    return "HV";
                },
                namespace: function () {
                    return "HV";
                }
            }
        ))
        .pipe(gulp.dest(distJs))
        .pipe(rename('hystrixviewer.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(distJs));
});

gulp.task('compile:js', ['clean'], function () {
    return gulp.src(jsFiles)
        .pipe(concat({path: 'hystrixviewer.js'}))
        .pipe(gulp.dest(distJs))
        .pipe(closureCompiler({
            compilerPath: 'lib/closure/closure-compiler-v20170521.jar',
            fileName: 'hystrixviewer.min.js',
            compilation_level: 'ADVANCED_OPTIMIZATIONS',
            language_in: 'ECMASCRIPT5_STRICT',
            language_out: 'ECMASCRIPT5_STRICT',
            warning_level: 'VERBOSE',
            externs: [
                'lib/externs/jquery-3.1.js',
                'lib/externs/d3_v4.7_externs.js'
            ]
        }))
        .pipe(gulp.dest(distJs));
});

gulp.task('clean:doc', function () {
    return gulp.src([doc + '*'], {read: false})
        .pipe(rimraf());
});

gulp.task('doc', ['clean:doc'], function () {
    return gulp.src(jsFiles)
        .pipe(jsdoc(doc));
});

// build css files from scss
gulp.task('build:css', function () {
    return gulp.src(scssFiles)
        .pipe(concat({path: 'hystrixviewer.css'}))
        .pipe(sass())
        .pipe(gulp.dest(distCss));
});

gulp.task('copy:img', function () {
    return gulp.src(imgFiles)
        .pipe(gulp.dest(distImg))
        .on('error', log);
});

// Check source js files with jshint
gulp.task('jshint', function () {
    return gulp.src(jsFiles)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Run the test suite
gulp.task('test', function () {
    return gulp.src([''])
        .pipe(testem({
            configFile: 'testem.json'
        }));
});

function log(error) {
    console.error(error.toString && error.toString());
}