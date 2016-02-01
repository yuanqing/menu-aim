import gulp from 'gulp';

gulp.task('watch', ['build'], () => {
  gulp.watch('src/**/*.js', ['build:build']);
});
