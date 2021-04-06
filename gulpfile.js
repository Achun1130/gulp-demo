const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const autoprefixer = require('autoprefixer');
const mainBowerFiles = require('main-bower-files');
const browserSync = require('browser-sync').create();
const minimist = require('minimist');

$.sass.compiler = require('node-sass');

const envOpts = {
  string: 'env',
  default: {
    env: 'develop',
  },
};

const opts = minimist(process.argv.slice(2), envOpts);

gulp.task('copyHTML', () => (
  gulp.src('./src/**/*.html')
    .pipe(gulp.dest('./dist/'))
));

gulp.task('clean', () => (
  gulp.src(['./.tmp', './dist'], { read: false })
    .pipe($.clean())
));

gulp.task('jade', () => (
  gulp.src('./src/**/*.jade')
    .pipe($.plumber())
    .pipe($.jade({
      pretty: opts.env === 'develop',
    }))
    .pipe(gulp.dest('./dist/'))
    .pipe(browserSync.stream())
));

gulp.task('sass', () => (
  gulp.src('./src/scss/**/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.postcss([autoprefixer()]))
    .pipe($.if(opts.env === 'production', $.cleanCss()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/css/'))
    .pipe(browserSync.stream())
));

gulp.task('babel', () => (
  gulp.src('./src/js/**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.babel({
      presets: ['@babel/env'],
    }))
    .pipe($.concat('all.js'))
    .pipe($.if(opts.env === 'production', $.uglify({
      compress: {
        drop_console: true,
      },
    })))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/js/'))
    .pipe(browserSync.stream())
));

gulp.task('bower', () => (
  gulp.src(mainBowerFiles())
    .pipe(gulp.dest('./.tmp/vendors/'))
));

gulp.task('vendorJs', () => (
  gulp.src('./.tmp/vendors/**/*.js')
    .pipe($.order([
      'jquery.js',
      'bootstrap.js',
    ]))
    .pipe($.concat('vendors.js'))
    .pipe($.if(opts.env === 'production', $.uglify({
      compress: {
        drop_console: true,
      },
    })))
    .pipe(gulp.dest('./dist/js/'))
));

gulp.task('browser-sync', () => {
  browserSync.init({
    server: {
      baseDir: './dist/',
    },
  });
});

gulp.task('watch', () => {
  gulp.watch('./src/scss/**/*.scss', gulp.parallel('sass'));
  gulp.watch('./src/**/*.jade', gulp.parallel('jade'));
  gulp.watch('./src/js/**/*.js', gulp.parallel('babel'));
});

gulp.task('image-min', () => (
  gulp.src('./src/images/*')
    .pipe($.if(opts.env === 'production', $.imagemin()))
    .pipe(gulp.dest('./dist/images/'))
));

gulp.task('default', gulp.series('sass', 'jade', 'babel', 'bower', 'vendorJs', 'image-min',
  gulp.parallel('watch', 'browser-sync')));

gulp.task('build', gulp.series('clean', 'sass', 'jade', 'babel', 'bower', 'vendorJs', 'image-min'));
