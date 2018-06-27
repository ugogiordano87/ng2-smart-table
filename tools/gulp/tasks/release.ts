const gulp = require('gulp');

gulp.task('build:release',
  gulp.series(':clean', ':build:table:release', ':build:release:clean-spec')
);
