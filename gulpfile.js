// Copyright 2015 Comet Lab AS.

// Permission to use, copy, modify, and/or distribute this software for any 
// purpose with or without fee is hereby granted, provided that the above 
// copyright notice and this permission notice appear in all copies.

// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF 
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR 
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES 
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
//  OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN 
// CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

var gulp = require('gulp');
var gulpJasmine = require('gulp-jasmine');
var istanbul = require('gulp-istanbul');
var coveralls = require('gulp-coveralls');
var path = require('path');

gulp.task('pre-test', function () {
  return gulp.src(['lib/**/*.js'])
    // Covering files
    .pipe(istanbul())
    // Force `require` to return covered files
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function () {
  return gulp.src(['spec/**/*.js'])
    .pipe(gulpJasmine())
    // Creating the reports after tests ran
    .pipe(istanbul.writeReports())
    // Enforce a coverage of at least 90%
    .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }));
});

gulp.task('coveralls', ['test'], function () {
    if (process.env.NODE_ENV !== 'travis') {
        return;
    }
    return gulp.src(path.join(__dirname, 'coverage/lcov.info'))
        .pipe(coveralls());
});

gulp.task('default', ['test', 'coveralls']);